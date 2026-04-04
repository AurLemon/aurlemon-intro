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
