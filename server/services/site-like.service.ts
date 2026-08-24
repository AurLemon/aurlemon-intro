import crypto from 'node:crypto'
import prisma from '~/lib/prisma'
import {
	DOMAIN_EVENT_NAMES,
	insertDomainEvent,
} from '~/server/utils/domain-events'
import {
	detectIpVersion,
	lookupIpRegionLabel,
} from '~/server/utils/ip-location'
import {
	SOCIAL_EVENT_NAMES,
	socialEventBus,
} from '~/server/utils/social-events'
import type {
	AuthUser,
	LoginUserListPagination,
	SiteLikeListPagination,
} from '~/shared/types/social'

export const getSiteLikeSummary = async (fingerprint?: string) => {
	const [totalCount, likedRecord, activeUserCount] = await Promise.all([
		prisma.like.count(),
		fingerprint
			? prisma.like.findUnique({ where: { fingerprint } })
			: Promise.resolve(null),
		prisma.user.count({ where: { status: 'ACTIVE' } }),
	])

	return {
		totalCount,
		hasLiked: Boolean(likedRecord),
		activeUserCount,
	}
}

const maskFingerprint = (fingerprint: string): string => {
	if (fingerprint.length <= 8) return `${fingerprint.slice(0, 4)}***`
	return `${fingerprint.slice(0, 8)}***${fingerprint.slice(-4)}`
}

const maskUsername = (username: string): string => {
	const chars = [...username]
	const first = chars[0] ?? ''
	const last = chars[chars.length - 1] ?? first
	return `${first}***${last}`
}

export const listSiteLikes = async (options: {
	page: number
	pageSize: number
}) => {
	const safePageSize = Math.max(1, Math.min(options.pageSize, 200))
	const totalCount = await prisma.like.count()
	const totalPages = Math.max(1, Math.ceil(totalCount / safePageSize))
	const page = Math.min(Math.max(1, options.page), totalPages)
	const likes = await prisma.like.findMany({
		orderBy: { timestamp: 'desc' },
		skip: (page - 1) * safePageSize,
		take: safePageSize,
	})

	const items = await Promise.all(
		likes.map(async (like) => ({
			likeId: like.id,
			maskedFingerprint: maskFingerprint(like.fingerprint),
			ip: like.ip,
			ipVersion: detectIpVersion(like.ip),
			ipRegionLabel: await lookupIpRegionLabel(like.ip),
			likedAt: like.timestamp.toISOString(),
		})),
	)

	return {
		items,
		pagination: {
			page,
			pageSize: safePageSize,
			totalPages,
			totalCount,
			hasPrev: page > 1,
			hasNext: page < totalPages,
		} satisfies SiteLikeListPagination,
	}
}

export const listLoginUsers = async (
	currentUser: AuthUser | null,
	options: { page: number; pageSize: number },
) => {
	const safePageSize = Math.max(1, Math.min(options.pageSize, 500))
	const canViewDetails = currentUser?.isAdmin === true
	const totalCount = await prisma.user.count({ where: { status: 'ACTIVE' } })
	const totalPages = Math.max(1, Math.ceil(totalCount / safePageSize))
	const page = Math.min(Math.max(1, options.page), totalPages)
	const users = await prisma.user.findMany({
		where: { status: 'ACTIVE' },
		orderBy: { createdAt: 'desc' },
		skip: (page - 1) * safePageSize,
		take: safePageSize,
		include: { identities: { orderBy: { createdAt: 'asc' } } },
	})

	return {
		items: users.map((item) => {
			const avatarUrl =
				item.identities.find(
					(identity) => identity.id === item.preferredAvatarIdentityId,
				)?.avatarUrl ??
				item.identities[0]?.avatarUrl ??
				null

			return {
				id: canViewDetails
					? item.id
					: crypto
							.createHash('sha256')
							.update(item.id)
							.digest('hex')
							.slice(0, 16),
				displayUsername: canViewDetails
					? item.username
					: maskUsername(item.username),
				avatarUrl,
				providers: item.identities.map((identity) => identity.provider),
				identities: canViewDetails
					? item.identities.map((identity) => ({
							provider: identity.provider,
							profileUrl: identity.profileUrl,
						}))
					: [],
				createdAt: item.createdAt.toISOString(),
				canViewDetails,
			}
		}),
		pagination: {
			page,
			pageSize: safePageSize,
			totalPages,
			totalCount,
			hasPrev: page > 1,
			hasNext: page < totalPages,
		} satisfies LoginUserListPagination,
	}
}

export const createSiteLike = async (
	fingerprint: string,
	ip: string,
): Promise<{
	totalCount: number
	hasLiked: boolean
	activeUserCount: number
}> => {
	const existingLike = await prisma.like.findUnique({ where: { fingerprint } })
	if (existingLike) {
		throw createError({ statusCode: 409, statusMessage: 'SITE_ALREADY_LIKED' })
	}
	const like = await prisma.$transaction(async (tx) => {
		const created = await tx.like.create({
			data: { fingerprint, ip, uuid: crypto.randomUUID() },
		})
		await insertDomainEvent(
			tx,
			DOMAIN_EVENT_NAMES.SITE_LIKED,
			String(created.id),
			{
				likeId: created.id,
				fingerprint: created.fingerprint,
			},
		)
		return created
	})
	socialEventBus.emit(SOCIAL_EVENT_NAMES.SITE_LIKED, {
		likeId: like.id,
		fingerprint: like.fingerprint,
		ip: like.ip,
		uuid: like.uuid,
		createdAt: like.timestamp.toISOString(),
	})
	return getSiteLikeSummary(fingerprint)
}
