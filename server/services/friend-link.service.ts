import { FriendLinkApplicationStatus, Prisma } from '~/generated/prisma/client'
import prisma from '~/lib/prisma'
import {
	DOMAIN_EVENT_NAMES,
	insertDomainEvent,
} from '~/server/utils/domain-events'
import {
	SOCIAL_EVENT_NAMES,
	socialEventBus,
} from '~/server/utils/social-events'
import { getLegacySnapshot } from '~/server/utils/user-auth'
import type {
	AdminFriendLinkListItem,
	AuthUser,
	FriendLinkApplicationItem,
	FriendLinkItem,
} from '~/shared/types/social'

const FALLBACK_COLORS = [
	'#0ea5e9',
	'#10b981',
	'#f59e0b',
	'#ef4444',
	'#8b5cf6',
	'#06b6d4',
]

let cleanupExpiredFriendLinkApplicationsInFlight: Promise<void> | null = null
const FRIEND_LINK_APPLICATION_EXPIRES_IN_DAYS = 30

interface FriendLinkPayload {
	name: string
	url: string
	desc: string
	imageBase64?: string | null
}

const isUniqueConstraintError = (error: unknown): boolean =>
	error instanceof Prisma.PrismaClientKnownRequestError &&
	error.code === 'P2002'

const getFallbackFriendLinkImage = (name: string): string => {
	const seed = [...name].reduce((total, char) => total + char.charCodeAt(0), 0)
	const color = FALLBACK_COLORS[seed % FALLBACK_COLORS.length]
	const initial = (name.trim().charAt(0) || '?').toUpperCase()
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96" role="img" aria-label="${initial}"><rect width="96" height="96" rx="20" fill="${color}"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-size="44" font-family="Arial, sans-serif" font-weight="700">${initial}</text></svg>`
	return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

const resolveFriendLinkImage = (
	name: string,
	imageBase64?: string | null,
): string => {
	if (typeof imageBase64 === 'string' && imageBase64.trim()) {
		return imageBase64.trim()
	}

	return getFallbackFriendLinkImage(name)
}

const mapApplication = (item: {
	id: string
	name: string
	url: string
	desc: string
	imageBase64: string
	applicantGithubLogin: string
	status: FriendLinkApplicationStatus
	expiresAt: Date
	approvedAt: Date | null
	approvedByGithubLogin: string | null
	createdAt: Date
	applicant?: { username: string } | null
	approvedBy?: { username: string } | null
}): FriendLinkApplicationItem => ({
	id: item.id,
	name: item.name,
	url: item.url,
	desc: item.desc,
	imageBase64: resolveFriendLinkImage(item.name, item.imageBase64),
	applicantUsername: item.applicant?.username ?? item.applicantGithubLogin,
	status: item.status,
	expiresAt: item.expiresAt.toISOString(),
	approvedAt: item.approvedAt?.toISOString() ?? null,
	approvedByUsername: item.approvedBy?.username ?? item.approvedByGithubLogin,
	createdAt: item.createdAt.toISOString(),
})

export const cleanupExpiredFriendLinkApplications = async (): Promise<void> => {
	if (cleanupExpiredFriendLinkApplicationsInFlight) {
		await cleanupExpiredFriendLinkApplicationsInFlight
		return
	}

	cleanupExpiredFriendLinkApplicationsInFlight = (async () => {
		const now = new Date()
		const expiredPending = await prisma.friendLinkApplication.findMany({
			where: {
				status: FriendLinkApplicationStatus.pending,
				expiresAt: {
					lte: now,
				},
			},
			select: {
				id: true,
			},
		})

		if (expiredPending.length === 0) {
			return
		}

		const expiredIds = await prisma.$transaction(async (tx) => {
			const ids: string[] = []
			for (const item of expiredPending) {
				const updated = await tx.friendLinkApplication.updateMany({
					where: {
						id: item.id,
						status: FriendLinkApplicationStatus.pending,
						expiresAt: { lte: now },
					},
					data: { status: FriendLinkApplicationStatus.expired },
				})
				if (updated.count !== 1) continue
				await insertDomainEvent(
					tx,
					DOMAIN_EVENT_NAMES.FRIEND_LINK_APPLICATION_EXPIRED,
					item.id,
					{ applicationId: item.id },
				)
				ids.push(item.id)
			}
			return ids
		})

		for (const applicationId of expiredIds) {
			socialEventBus.emit(SOCIAL_EVENT_NAMES.FRIEND_LINK_APPLICATION_EXPIRED, {
				applicationId,
				expiredAt: now.toISOString(),
			})
		}
	})().finally(() => {
		cleanupExpiredFriendLinkApplicationsInFlight = null
	})

	await cleanupExpiredFriendLinkApplicationsInFlight
}

export const listActiveFriendLinks = async (): Promise<FriendLinkItem[]> => {
	await cleanupExpiredFriendLinkApplications()

	const items = await prisma.friendLink.findMany({
		where: {
			isActive: true,
		},
		orderBy: {
			createdAt: 'desc',
		},
	})

	return items.map((item) => ({
		id: item.id,
		name: item.name,
		url: item.url,
		desc: item.desc,
		icon: resolveFriendLinkImage(item.name, item.imageBase64),
		source: 'database',
	}))
}

export const submitFriendLinkApplication = async (
	currentUser: AuthUser,
	payload: {
		name: string
		url: string
		desc: string
		imageBase64?: string | null
	},
): Promise<void> => {
	await cleanupExpiredFriendLinkApplications()

	const [existingLink, existingPending] = await Promise.all([
		prisma.friendLink.findUnique({
			where: {
				url: payload.url,
			},
			select: {
				id: true,
			},
		}),
		prisma.friendLinkApplication.findFirst({
			where: {
				url: payload.url,
				status: FriendLinkApplicationStatus.pending,
			},
			select: {
				id: true,
			},
		}),
	])

	if (existingLink) {
		throw createError({
			statusCode: 409,
			statusMessage: 'FRIEND_LINK_ALREADY_EXISTS',
		})
	}

	if (existingPending) {
		throw createError({
			statusCode: 409,
			statusMessage: 'FRIEND_LINK_APPLICATION_PENDING',
		})
	}

	const legacyLogin = getLegacySnapshot(currentUser).legacyLogin
	const application = await prisma
		.$transaction(async (tx) => {
			const created = await tx.friendLinkApplication.create({
				data: {
					name: payload.name,
					url: payload.url,
					desc: payload.desc,
					imageBase64: resolveFriendLinkImage(
						payload.name,
						payload.imageBase64,
					),
					applicantGithubLogin: legacyLogin,
					applicantUserId: currentUser.id,
					expiresAt: new Date(
						Date.now() +
							1000 * 60 * 60 * 24 * FRIEND_LINK_APPLICATION_EXPIRES_IN_DAYS,
					),
				},
			})
			await insertDomainEvent(
				tx,
				DOMAIN_EVENT_NAMES.FRIEND_LINK_APPLICATION_SUBMITTED,
				created.id,
				{
					applicationId: created.id,
					applicantUserId: currentUser.id,
				},
			)
			return created
		})
		.catch((error: unknown) => {
			if (isUniqueConstraintError(error)) {
				throw createError({
					statusCode: 409,
					statusMessage: 'FRIEND_LINK_APPLICATION_PENDING',
				})
			}
			throw error
		})

	socialEventBus.emit(SOCIAL_EVENT_NAMES.FRIEND_LINK_APPLICATION_SUBMITTED, {
		applicationId: application.id,
		applicantUserId: currentUser.id,
		applicantUsername: currentUser.username,
		name: application.name,
		url: application.url,
		desc: application.desc,
		imageBase64: application.imageBase64,
		expiresAt: application.expiresAt.toISOString(),
		createdAt: application.createdAt.toISOString(),
	})
}

export const listPendingFriendLinkApplications = async (): Promise<
	FriendLinkApplicationItem[]
> => {
	await cleanupExpiredFriendLinkApplications()

	const items = await prisma.friendLinkApplication.findMany({
		where: {
			status: FriendLinkApplicationStatus.pending,
		},
		orderBy: {
			createdAt: 'asc',
		},
		include: { applicant: true, approvedBy: true },
	})

	return items.map(mapApplication)
}

export const listAdminFriendLinkItems = async (): Promise<
	AdminFriendLinkListItem[]
> => {
	await cleanupExpiredFriendLinkApplications()

	const [activeLinks, pendingApplications] = await Promise.all([
		prisma.friendLink.findMany({
			where: {
				isActive: true,
			},
			orderBy: {
				createdAt: 'desc',
			},
		}),
		prisma.friendLinkApplication.findMany({
			where: {
				status: FriendLinkApplicationStatus.pending,
			},
			orderBy: {
				createdAt: 'desc',
			},
			include: { applicant: true, approvedBy: true },
		}),
	])

	const items: AdminFriendLinkListItem[] = [
		...pendingApplications.map((item) => ({
			id: item.id,
			type: 'pending-application' as const,
			name: item.name,
			url: item.url,
			desc: item.desc,
			imageBase64: resolveFriendLinkImage(item.name, item.imageBase64),
			createdAt: item.createdAt.toISOString(),
			applicantUsername: item.applicant?.username ?? item.applicantGithubLogin,
		})),
		...activeLinks.map((item) => ({
			id: item.id,
			type: 'friend-link' as const,
			name: item.name,
			url: item.url,
			desc: item.desc,
			imageBase64: resolveFriendLinkImage(item.name, item.imageBase64),
			createdAt: item.createdAt.toISOString(),
			applicantUsername: null,
		})),
	]

	return items.sort(
		(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
	)
}

export const approveFriendLinkApplication = async (
	applicationId: string,
	currentUser: AuthUser,
	payload?: FriendLinkPayload,
): Promise<void> => {
	await cleanupExpiredFriendLinkApplications()
	const approvedAt = new Date()
	const legacyLogin = getLegacySnapshot(currentUser).legacyLogin
	await prisma.$transaction(async (tx) => {
		const pending = await tx.friendLinkApplication.findFirst({
			where: {
				id: applicationId,
				status: FriendLinkApplicationStatus.pending,
				expiresAt: { gt: approvedAt },
			},
		})
		if (!pending) {
			throw createError({
				statusCode: 404,
				statusMessage: 'FRIEND_LINK_APPLICATION_NOT_FOUND',
			})
		}
		const next = {
			name: payload?.name ?? pending.name,
			url: payload?.url ?? pending.url,
			desc: payload?.desc ?? pending.desc,
			imageBase64: resolveFriendLinkImage(
				payload?.name ?? pending.name,
				payload?.imageBase64 ?? pending.imageBase64,
			),
		}
		const [existingLink, existingPending] = await Promise.all([
			tx.friendLink.findUnique({
				where: { url: next.url },
				select: { id: true },
			}),
			tx.friendLinkApplication.findFirst({
				where: {
					url: next.url,
					status: FriendLinkApplicationStatus.pending,
					id: { not: pending.id },
				},
				select: { id: true },
			}),
		])
		if (existingLink) {
			throw createError({
				statusCode: 409,
				statusMessage: 'FRIEND_LINK_ALREADY_EXISTS',
			})
		}
		if (existingPending) {
			throw createError({
				statusCode: 409,
				statusMessage: 'FRIEND_LINK_APPLICATION_PENDING',
			})
		}
		const approved = await tx.friendLinkApplication.updateMany({
			where: {
				id: pending.id,
				status: FriendLinkApplicationStatus.pending,
			},
			data: {
				...next,
				status: FriendLinkApplicationStatus.approved,
				approvedAt,
				approvedByGithubLogin: legacyLogin,
				approvedByUserId: currentUser.id,
			},
		})
		if (approved.count !== 1) {
			throw createError({
				statusCode: 404,
				statusMessage: 'FRIEND_LINK_APPLICATION_NOT_FOUND',
			})
		}
		await tx.friendLink.create({
			data: {
				...next,
				createdByGithubLogin: pending.applicantGithubLogin,
				approvedByGithubLogin: legacyLogin,
				createdByUserId: pending.applicantUserId,
				approvedByUserId: currentUser.id,
			},
		})
		await insertDomainEvent(
			tx,
			DOMAIN_EVENT_NAMES.FRIEND_LINK_APPLICATION_APPROVED,
			pending.id,
			{
				applicationId: pending.id,
				approvedByUserId: currentUser.id,
			},
		)
	})

	socialEventBus.emit(SOCIAL_EVENT_NAMES.FRIEND_LINK_APPLICATION_APPROVED, {
		applicationId,
		approvedByUserId: currentUser.id,
		approvedByUsername: currentUser.username,
		approvedAt: approvedAt.toISOString(),
	})
}

export const rejectFriendLinkApplicationByAdmin = async (
	applicationId: string,
	currentUser: AuthUser,
): Promise<void> => {
	await cleanupExpiredFriendLinkApplications()
	const rejected = await prisma.friendLinkApplication.updateMany({
		where: {
			id: applicationId,
			status: FriendLinkApplicationStatus.pending,
			expiresAt: { gt: new Date() },
		},
		data: { status: FriendLinkApplicationStatus.rejected },
	})

	if (rejected.count !== 1) {
		throw createError({
			statusCode: 404,
			statusMessage: 'FRIEND_LINK_APPLICATION_NOT_FOUND',
		})
	}

	socialEventBus.emit(SOCIAL_EVENT_NAMES.FRIEND_LINK_APPLICATION_REJECTED, {
		applicationId,
		rejectedByUserId: currentUser.id,
		rejectedByUsername: currentUser.username,
		rejectedAt: new Date().toISOString(),
	})
}

export const createFriendLinkDirectly = async (
	currentUser: AuthUser,
	payload: {
		name: string
		url: string
		desc: string
		imageBase64?: string | null
	},
): Promise<void> => {
	const existingLink = await prisma.friendLink.findUnique({
		where: {
			url: payload.url,
		},
		select: {
			id: true,
		},
	})

	if (existingLink) {
		throw createError({
			statusCode: 409,
			statusMessage: 'FRIEND_LINK_ALREADY_EXISTS',
		})
	}

	const legacyLogin = getLegacySnapshot(currentUser).legacyLogin
	const friendLink = await prisma.$transaction(async (tx) => {
		const created = await tx.friendLink.create({
			data: {
				name: payload.name,
				url: payload.url,
				desc: payload.desc,
				imageBase64: resolveFriendLinkImage(payload.name, payload.imageBase64),
				createdByGithubLogin: legacyLogin,
				approvedByGithubLogin: legacyLogin,
				createdByUserId: currentUser.id,
				approvedByUserId: currentUser.id,
			},
		})
		await insertDomainEvent(
			tx,
			DOMAIN_EVENT_NAMES.FRIEND_LINK_CREATED,
			created.id,
			{ friendLinkId: created.id, createdByUserId: currentUser.id },
		)
		return created
	})

	socialEventBus.emit(SOCIAL_EVENT_NAMES.FRIEND_LINK_CREATED, {
		friendLinkId: friendLink.id,
		name: friendLink.name,
		url: friendLink.url,
		desc: friendLink.desc,
		imageBase64: friendLink.imageBase64,
		createdByUserId: currentUser.id,
		createdByUsername: currentUser.username,
		createdAt: friendLink.createdAt.toISOString(),
	})
}

export const updateFriendLinkByAdmin = async (
	friendLinkId: string,
	currentUser: AuthUser,
	payload: {
		name: string
		url: string
		desc: string
		imageBase64?: string | null
	},
): Promise<void> => {
	const current = await prisma.friendLink.findUnique({
		where: {
			id: friendLinkId,
		},
		select: {
			id: true,
			name: true,
			imageBase64: true,
		},
	})

	if (!current) {
		throw createError({
			statusCode: 404,
			statusMessage: 'FRIEND_LINK_NOT_FOUND',
		})
	}

	const updated = await prisma.$transaction(async (tx) => {
		const result = await tx.friendLink.update({
			where: { id: friendLinkId },
			data: {
				name: payload.name,
				url: payload.url,
				desc: payload.desc,
				imageBase64: resolveFriendLinkImage(
					payload.name,
					payload.imageBase64 ?? current.imageBase64,
				),
			},
		})
		await insertDomainEvent(
			tx,
			DOMAIN_EVENT_NAMES.FRIEND_LINK_UPDATED,
			friendLinkId,
			{ friendLinkId, updatedByUserId: currentUser.id },
		)
		return result
	})

	socialEventBus.emit(SOCIAL_EVENT_NAMES.FRIEND_LINK_UPDATED, {
		friendLinkId: updated.id,
		name: updated.name,
		url: updated.url,
		desc: updated.desc,
		imageBase64: updated.imageBase64,
		updatedByUserId: currentUser.id,
		updatedByUsername: currentUser.username,
		updatedAt: updated.updatedAt.toISOString(),
	})
}

export const deleteFriendLinkByAdmin = async (
	friendLinkId: string,
	currentUser: AuthUser,
): Promise<void> => {
	const current = await prisma.friendLink.findUnique({
		where: {
			id: friendLinkId,
		},
		select: {
			id: true,
		},
	})

	if (!current) {
		throw createError({
			statusCode: 404,
			statusMessage: 'FRIEND_LINK_NOT_FOUND',
		})
	}

	await prisma.$transaction(async (tx) => {
		await tx.friendLink.delete({ where: { id: friendLinkId } })
		await insertDomainEvent(
			tx,
			DOMAIN_EVENT_NAMES.FRIEND_LINK_DELETED,
			friendLinkId,
			{ friendLinkId, deletedByUserId: currentUser.id },
		)
	})

	socialEventBus.emit(SOCIAL_EVENT_NAMES.FRIEND_LINK_DELETED, {
		friendLinkId,
		deletedByUserId: currentUser.id,
		deletedByUsername: currentUser.username,
		deletedAt: new Date().toISOString(),
	})
}
