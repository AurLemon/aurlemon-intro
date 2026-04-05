import crypto from 'node:crypto'
import prisma from '~/lib/prisma'
import {
	SOCIAL_EVENT_NAMES,
	socialEventBus,
} from '~/server/utils/social-events'

export const getSiteLikeSummary = async (fingerprint?: string) => {
	const [totalCount, likedRecord] = await Promise.all([
		prisma.like.count(),
		fingerprint
			? prisma.like.findUnique({
					where: {
						fingerprint,
					},
				})
			: Promise.resolve(null),
	])

	return {
		totalCount,
		hasLiked: Boolean(likedRecord),
	}
}

const maskFingerprint = (fingerprint: string): string => {
	if (fingerprint.length <= 8) {
		return `${fingerprint.slice(0, 4)}***`
	}

	return `${fingerprint.slice(0, 8)}***${fingerprint.slice(-4)}`
}

export const listSiteLikes = async (limit = 100) => {
	const safeLimit = Math.max(1, Math.min(limit, 200))
	const likes = await prisma.like.findMany({
		orderBy: {
			timestamp: 'desc',
		},
		take: safeLimit,
	})

	return {
		items: likes.map((like) => ({
			likeId: like.id,
			maskedFingerprint: maskFingerprint(like.fingerprint),
			likedAt: like.timestamp.toISOString(),
		})),
	}
}

export const createSiteLike = async (
	fingerprint: string,
	ip: string,
): Promise<{ totalCount: number; hasLiked: boolean }> => {
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
