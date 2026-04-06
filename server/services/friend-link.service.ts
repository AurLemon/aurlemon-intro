import { FriendLinkApplicationStatus, Prisma } from '@prisma/client'
import prisma from '~/lib/prisma'
import {
	SOCIAL_EVENT_NAMES,
	socialEventBus,
} from '~/server/utils/social-events'
import type {
	AdminFriendLinkListItem,
	FriendLinkApplicationItem,
	FriendLinkItem,
	GithubAuthUser,
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

const isUniqueConstraintError = (error: unknown): boolean => {
	return (
		error instanceof Prisma.PrismaClientKnownRequestError &&
		error.code === 'P2002'
	)
}

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
}): FriendLinkApplicationItem => ({
	id: item.id,
	name: item.name,
	url: item.url,
	desc: item.desc,
	imageBase64: resolveFriendLinkImage(item.name, item.imageBase64),
	applicantGithubLogin: item.applicantGithubLogin,
	status: item.status,
	expiresAt: item.expiresAt.toISOString(),
	approvedAt: item.approvedAt?.toISOString() ?? null,
	approvedByGithubLogin: item.approvedByGithubLogin,
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

		await prisma.friendLinkApplication.updateMany({
			where: {
				id: {
					in: expiredPending.map((item) => item.id),
				},
				status: FriendLinkApplicationStatus.pending,
				expiresAt: {
					lte: now,
				},
			},
			data: {
				status: FriendLinkApplicationStatus.expired,
			},
		})

		for (const item of expiredPending) {
			socialEventBus.emit(SOCIAL_EVENT_NAMES.FRIEND_LINK_APPLICATION_EXPIRED, {
				applicationId: item.id,
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
	currentUser: GithubAuthUser,
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

	const application = await prisma.friendLinkApplication.create({
		data: {
			name: payload.name,
			url: payload.url,
			desc: payload.desc,
			imageBase64: resolveFriendLinkImage(payload.name, payload.imageBase64),
			applicantGithubLogin: currentUser.githubLogin,
			expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
		},
	})

	socialEventBus.emit(SOCIAL_EVENT_NAMES.FRIEND_LINK_APPLICATION_SUBMITTED, {
		applicationId: application.id,
		applicantGithubLogin: application.applicantGithubLogin,
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
			applicantGithubLogin: item.applicantGithubLogin,
		})),
		...activeLinks.map((item) => ({
			id: item.id,
			type: 'friend-link' as const,
			name: item.name,
			url: item.url,
			desc: item.desc,
			imageBase64: resolveFriendLinkImage(item.name, item.imageBase64),
			createdAt: item.createdAt.toISOString(),
			applicantGithubLogin: null,
		})),
	]

	return items.sort(
		(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
	)
}

export const approveFriendLinkApplication = async (
	applicationId: string,
	currentUser: GithubAuthUser,
): Promise<void> => {
	await cleanupExpiredFriendLinkApplications()
	const approvedAt = new Date()
	const approveResult = await prisma.friendLinkApplication.updateMany({
		where: {
			id: applicationId,
			status: FriendLinkApplicationStatus.pending,
			expiresAt: {
				gt: approvedAt,
			},
		},
		data: {
			status: FriendLinkApplicationStatus.approved,
			approvedAt,
			approvedByGithubLogin: currentUser.githubLogin,
		},
	})

	if (approveResult.count === 0) {
		throw createError({
			statusCode: 404,
			statusMessage: 'FRIEND_LINK_APPLICATION_NOT_FOUND',
		})
	}

	socialEventBus.emit(SOCIAL_EVENT_NAMES.FRIEND_LINK_APPLICATION_APPROVED, {
		applicationId,
		approvedByGithubLogin: currentUser.githubLogin,
		approvedAt: approvedAt.toISOString(),
	})
}

export const createFriendLinkDirectly = async (
	currentUser: GithubAuthUser,
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

	const friendLink = await prisma.friendLink.create({
		data: {
			name: payload.name,
			url: payload.url,
			desc: payload.desc,
			imageBase64: resolveFriendLinkImage(payload.name, payload.imageBase64),
			createdByGithubLogin: currentUser.githubLogin,
			approvedByGithubLogin: currentUser.githubLogin,
		},
	})

	socialEventBus.emit(SOCIAL_EVENT_NAMES.FRIEND_LINK_CREATED, {
		friendLinkId: friendLink.id,
		name: friendLink.name,
		url: friendLink.url,
		desc: friendLink.desc,
		imageBase64: friendLink.imageBase64,
		createdByGithubLogin: currentUser.githubLogin,
		createdAt: friendLink.createdAt.toISOString(),
	})
}

export const updateFriendLinkByAdmin = async (
	friendLinkId: string,
	currentUser: GithubAuthUser,
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

	const updated = await prisma.friendLink.update({
		where: {
			id: friendLinkId,
		},
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

	socialEventBus.emit(SOCIAL_EVENT_NAMES.FRIEND_LINK_UPDATED, {
		friendLinkId: updated.id,
		name: updated.name,
		url: updated.url,
		desc: updated.desc,
		imageBase64: updated.imageBase64,
		updatedByGithubLogin: currentUser.githubLogin,
		updatedAt: updated.updatedAt.toISOString(),
	})
}

export const deleteFriendLinkByAdmin = async (
	friendLinkId: string,
	currentUser: GithubAuthUser,
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

	await prisma.friendLink.delete({
		where: {
			id: friendLinkId,
		},
	})

	socialEventBus.emit(SOCIAL_EVENT_NAMES.FRIEND_LINK_DELETED, {
		friendLinkId,
		deletedByGithubLogin: currentUser.githubLogin,
		deletedAt: new Date().toISOString(),
	})
}

export const materializeApprovedFriendLink = async (
	applicationId: string,
	approvedByGithubLogin: string,
): Promise<void> => {
	const application = await prisma.friendLinkApplication.findUnique({
		where: {
			id: applicationId,
		},
	})

	if (
		!application ||
		application.status !== FriendLinkApplicationStatus.approved
	) {
		return
	}

	const existingLink = await prisma.friendLink.findUnique({
		where: {
			url: application.url,
		},
		select: {
			id: true,
		},
	})

	if (existingLink) {
		return
	}

	const friendLink = await prisma.friendLink
		.create({
			data: {
				name: application.name,
				url: application.url,
				desc: application.desc,
				imageBase64: application.imageBase64,
				createdByGithubLogin: application.applicantGithubLogin,
				approvedByGithubLogin,
			},
		})
		.catch((error: unknown) => {
			if (isUniqueConstraintError(error)) {
				return null
			}

			throw error
		})

	if (!friendLink) {
		return
	}

	socialEventBus.emit(SOCIAL_EVENT_NAMES.FRIEND_LINK_CREATED, {
		friendLinkId: friendLink.id,
		name: friendLink.name,
		url: friendLink.url,
		desc: friendLink.desc,
		imageBase64: friendLink.imageBase64,
		createdByGithubLogin: application.applicantGithubLogin,
		createdAt: friendLink.createdAt.toISOString(),
	})
}
