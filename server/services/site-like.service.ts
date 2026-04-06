import crypto from 'node:crypto'
import prisma from '~/lib/prisma'
import {
	detectIpVersion,
	lookupIpRegionLabel,
} from '~/server/utils/ip-location'
import {
	SOCIAL_EVENT_NAMES,
	socialEventBus,
} from '~/server/utils/social-events'
import type { GithubAuthUser } from '~/shared/types/social'

const GITHUB_SESSION_CLEANUP_COOLDOWN_MS = 60_000
let lastGithubSessionCleanupAt = 0
let githubSessionCleanupInFlight: Promise<void> | null = null

const cleanupExpiredDuplicateGithubSessions = async (): Promise<void> => {
	const nowMs = Date.now()

	if (nowMs - lastGithubSessionCleanupAt < GITHUB_SESSION_CLEANUP_COOLDOWN_MS) {
		return
	}

	if (githubSessionCleanupInFlight) {
		await githubSessionCleanupInFlight
		return
	}

	githubSessionCleanupInFlight = prisma.githubSession
		.findMany({
			orderBy: [
				{
					githubLogin: 'asc',
				},
				{
					createdAt: 'desc',
				},
				{
					id: 'desc',
				},
			],
			select: {
				id: true,
				githubLogin: true,
				expiresAt: true,
			},
		})
		.then(async (sessions) => {
			const now = new Date()
			const seenGithubLogins = new Set<string>()
			const expiredDuplicateSessionIds: string[] = []

			for (const session of sessions) {
				if (!seenGithubLogins.has(session.githubLogin)) {
					// Keep the newest session for each GitHub user.
					seenGithubLogins.add(session.githubLogin)
					continue
				}

				if (session.expiresAt <= now) {
					expiredDuplicateSessionIds.push(session.id)
				}
			}

			if (expiredDuplicateSessionIds.length === 0) {
				return
			}

			await prisma.githubSession.deleteMany({
				where: {
					id: {
						in: expiredDuplicateSessionIds,
					},
				},
			})
		})
		.then(() => {
			lastGithubSessionCleanupAt = Date.now()
		})
		.finally(() => {
			githubSessionCleanupInFlight = null
		})

	await githubSessionCleanupInFlight
}

export const getSiteLikeSummary = async (fingerprint?: string) => {
	await cleanupExpiredDuplicateGithubSessions()

	const [totalCount, likedRecord, githubLoginGroups] = await Promise.all([
		prisma.like.count(),
		fingerprint
			? prisma.like.findUnique({
					where: {
						fingerprint,
					},
				})
			: Promise.resolve(null),
		prisma.githubSession.groupBy({
			by: ['githubLogin'],
		}),
	])

	return {
		totalCount,
		hasLiked: Boolean(likedRecord),
		githubLoginUserCount: githubLoginGroups.length,
	}
}

const maskFingerprint = (fingerprint: string): string => {
	if (fingerprint.length <= 8) {
		return `${fingerprint.slice(0, 4)}***`
	}

	return `${fingerprint.slice(0, 8)}***${fingerprint.slice(-4)}`
}

const maskGithubLogin = (githubLogin: string): string => {
	const chars = [...githubLogin]
	const first = chars[0] ?? ''
	const last = chars[chars.length - 1] ?? first

	return `${first}***${last}`
}

export const listSiteLikes = async (limit = 100) => {
	const safeLimit = Math.max(1, Math.min(limit, 200))
	const likes = await prisma.like.findMany({
		orderBy: {
			timestamp: 'desc',
		},
		take: safeLimit,
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
	}
}

export const listGithubLoginUsers = async (
	currentUser: GithubAuthUser | null,
	limit = 100,
) => {
	await cleanupExpiredDuplicateGithubSessions()

	const safeLimit = Math.max(1, Math.min(limit, 500))
	const canViewProfile = currentUser?.isAdmin === true
	const sessions = await prisma.githubSession.findMany({
		orderBy: {
			createdAt: 'desc',
		},
		select: {
			id: true,
			githubLogin: true,
			avatarUrl: true,
			profileUrl: true,
			createdAt: true,
			expiresAt: true,
		},
	})

	const userMap = new Map<
		string,
		{
			id: string
			githubLogin: string
			avatarUrl: string
			profileUrl: string
			createdAt: Date
			expiresAt: Date
		}
	>()

	for (const session of sessions) {
		if (!userMap.has(session.githubLogin)) {
			userMap.set(session.githubLogin, session)
		}
	}

	const items = [...userMap.values()].slice(0, safeLimit).map((item) => ({
		id: item.id,
		displayLogin: canViewProfile
			? item.githubLogin
			: maskGithubLogin(item.githubLogin),
		avatarUrl: item.avatarUrl,
		profileUrl: canViewProfile ? item.profileUrl : null,
		createdAt: item.createdAt.toISOString(),
		expiresAt: item.expiresAt.toISOString(),
		canViewProfile,
	}))

	return {
		items,
	}
}

export const createSiteLike = async (
	fingerprint: string,
	ip: string,
): Promise<{
	totalCount: number
	hasLiked: boolean
	githubLoginUserCount: number
}> => {
	const existingLike = await prisma.like.findUnique({
		where: {
			fingerprint,
		},
	})

	if (existingLike) {
		throw createError({
			statusCode: 409,
			statusMessage: 'SITE_ALREADY_LIKED',
		})
	}

	const like = await prisma.like.create({
		data: {
			fingerprint,
			ip,
			uuid: crypto.randomUUID(),
		},
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
