import crypto from 'node:crypto'
import {
	EmailSource,
	Prisma,
	UserRole,
	UserStatus,
} from '~/generated/prisma/client'
import type { OAuthProvider } from '~/generated/prisma/client'
import prisma from '~/lib/prisma'
import {
	DOMAIN_EVENT_NAMES,
	insertDomainEvent,
} from '~/server/utils/domain-events'
import { hashSecret, getUserById } from '~/server/utils/user-auth'
import type {
	AccountDetails,
	AccountEmail,
	AccountNotificationPreference,
	AuthUser,
} from '~/shared/types/social'

const HANDLE_PATTERN = /^[A-Za-z0-9_-]{1,39}$/
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const EMAIL_VERIFY_TTL_MS = 30 * 60 * 1000

const normalize = (value: string): string => value.trim().toLowerCase()
const hasControlCharacters = (value: string): boolean =>
	[...value].some((character) => {
		const codePoint = character.codePointAt(0) ?? 0
		return codePoint <= 31 || codePoint === 127
	})

const preferenceSelect = {
	replyEmailEnabled: true,
	adminCommentEmailEnabled: true,
	adminFriendLinkEmailEnabled: true,
} satisfies Prisma.UserNotificationPreferenceSelect

const toAccountEmail = (item: {
	id: string
	email: string
	verifiedAt: Date | null
	isPrimary: boolean
	source: EmailSource
}): AccountEmail => ({
	id: item.id,
	email: item.email,
	verified: Boolean(item.verifiedAt),
	isPrimary: item.isPrimary,
	source: item.source,
})

export const getAccountDetails = async (
	currentUser: AuthUser,
): Promise<AccountDetails> => {
	const [emails, notifications] = await Promise.all([
		prisma.userEmail.findMany({
			where: { userId: currentUser.id },
			orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
		}),
		prisma.userNotificationPreference.upsert({
			where: { userId: currentUser.id },
			create: { userId: currentUser.id, replyEmailEnabled: true },
			update: {},
			select: preferenceSelect,
		}),
	])

	return {
		user: currentUser,
		emails: emails.map(toAccountEmail),
		notifications,
	}
}

export const updateAccountProfile = async (
	currentUser: AuthUser,
	payload: {
		username: unknown
		displayName: unknown
		preferredAvatarIdentityId: unknown
		preferredLocale: unknown
	},
): Promise<AuthUser> => {
	const username =
		typeof payload.username === 'string' ? payload.username.trim() : ''
	const displayName =
		typeof payload.displayName === 'string' ? payload.displayName.trim() : ''
	const preferredAvatarIdentityId =
		typeof payload.preferredAvatarIdentityId === 'string'
			? payload.preferredAvatarIdentityId
			: null
	const preferredLocale = ['zh-CN', 'en-US', 'ja-JP'].includes(
		String(payload.preferredLocale),
	)
		? String(payload.preferredLocale)
		: 'zh-CN'

	if (!HANDLE_PATTERN.test(username)) {
		throw createError({ statusCode: 400, statusMessage: 'INVALID_USERNAME' })
	}
	const existingUser = await prisma.user.findUnique({
		where: { id: currentUser.id },
		select: { usernameNormalized: true, usernameUpdatedAt: true },
	})
	const usernameChanged =
		existingUser?.usernameNormalized !== normalize(username)
	if (
		usernameChanged &&
		existingUser?.usernameUpdatedAt &&
		existingUser.usernameUpdatedAt.getTime() >
			Date.now() - 7 * 24 * 60 * 60 * 1000
	) {
		throw createError({
			statusCode: 429,
			statusMessage: 'USERNAME_CHANGE_COOLDOWN',
		})
	}
	if (
		!displayName ||
		displayName.length > 64 ||
		hasControlCharacters(displayName)
	) {
		throw createError({
			statusCode: 400,
			statusMessage: 'INVALID_USER_DISPLAY_NAME',
		})
	}
	if (preferredAvatarIdentityId) {
		const identity = await prisma.oAuthIdentity.findFirst({
			where: { id: preferredAvatarIdentityId, userId: currentUser.id },
			select: { id: true },
		})
		if (!identity) {
			throw createError({
				statusCode: 400,
				statusMessage: 'INVALID_AVATAR_IDENTITY',
			})
		}
	}

	try {
		await prisma.user.update({
			where: { id: currentUser.id },
			data: {
				username,
				usernameNormalized: normalize(username),
				usernameUpdatedAt: usernameChanged ? new Date() : undefined,
				displayName,
				preferredAvatarIdentityId,
				preferredLocale,
			},
		})
	} catch (error) {
		if (
			error instanceof Prisma.PrismaClientKnownRequestError &&
			error.code === 'P2002'
		) {
			throw createError({ statusCode: 409, statusMessage: 'USERNAME_TAKEN' })
		}
		throw error
	}

	return (await getUserById(currentUser.id))!
}

export const updateNotificationPreferences = async (
	currentUser: AuthUser,
	payload: Partial<AccountNotificationPreference>,
): Promise<AccountNotificationPreference> => {
	if (
		!currentUser.isAdmin &&
		(payload.adminCommentEmailEnabled === true ||
			payload.adminFriendLinkEmailEnabled === true)
	) {
		throw createError({ statusCode: 403, statusMessage: 'ADMIN_REQUIRED' })
	}

	return prisma.userNotificationPreference.upsert({
		where: { userId: currentUser.id },
		create: {
			userId: currentUser.id,
			replyEmailEnabled: payload.replyEmailEnabled ?? true,
			adminCommentEmailEnabled: currentUser.isAdmin
				? (payload.adminCommentEmailEnabled ?? false)
				: false,
			adminFriendLinkEmailEnabled: currentUser.isAdmin
				? (payload.adminFriendLinkEmailEnabled ?? false)
				: false,
		},
		update: {
			replyEmailEnabled: payload.replyEmailEnabled,
			adminCommentEmailEnabled: currentUser.isAdmin
				? payload.adminCommentEmailEnabled
				: undefined,
			adminFriendLinkEmailEnabled: currentUser.isAdmin
				? payload.adminFriendLinkEmailEnabled
				: undefined,
		},
		select: preferenceSelect,
	})
}

export const requestEmailVerification = async (
	currentUser: AuthUser,
	rawEmail: unknown,
): Promise<AccountEmail> => {
	const email = typeof rawEmail === 'string' ? rawEmail.trim() : ''
	const emailNormalized = normalize(email)
	if (!email || email.length > 320 || !EMAIL_PATTERN.test(email)) {
		throw createError({ statusCode: 400, statusMessage: 'INVALID_EMAIL' })
	}
	const conflict = await prisma.userEmail.findUnique({
		where: { emailNormalized },
	})
	if (conflict && conflict.userId !== currentUser.id) {
		throw createError({
			statusCode: 409,
			statusMessage: 'EMAIL_ALREADY_IN_USE',
		})
	}
	const recentCount = await prisma.emailVerificationToken.count({
		where: {
			userId: currentUser.id,
			createdAt: { gt: new Date(Date.now() - 60 * 60 * 1000) },
		},
	})
	if (recentCount >= 5) {
		throw createError({
			statusCode: 429,
			statusMessage: 'EMAIL_VERIFICATION_RATE_LIMITED',
		})
	}

	const token = crypto.randomBytes(32).toString('base64url')
	const siteUrl = process.env.NUXT_SITE_URL?.replace(/\/$/, '')
	if (!siteUrl) {
		throw createError({
			statusCode: 500,
			statusMessage: 'SITE_URL_NOT_CONFIGURED',
		})
	}

	const userEmail = await prisma.$transaction(async (tx) => {
		const existingPrimary = await tx.userEmail.count({
			where: { userId: currentUser.id, isPrimary: true },
		})
		const emailRecord = conflict
			? await tx.userEmail.update({
					where: { id: conflict.id },
					data: { email },
				})
			: await tx.userEmail.create({
					data: {
						userId: currentUser.id,
						email,
						emailNormalized,
						source: EmailSource.MANUAL,
						isPrimary: existingPrimary === 0,
					},
				})
		const verification = await tx.emailVerificationToken.create({
			data: {
				userId: currentUser.id,
				userEmailId: emailRecord.id,
				tokenHash: hashSecret(token),
				expiresAt: new Date(Date.now() + EMAIL_VERIFY_TTL_MS),
			},
		})
		await tx.emailOutbox.create({
			data: {
				recipientEmail: email,
				templateKey: 'email.verify',
				locale: currentUser.preferredLocale,
				variablesJson: JSON.stringify({
					displayName: currentUser.displayName,
					verifyUrl: `${siteUrl}/api/account/emails/verify?token=${encodeURIComponent(token)}&locale=${encodeURIComponent(currentUser.preferredLocale)}`,
				}),
				dedupeKey: `email.verify:${verification.id}`,
			},
		})
		return emailRecord
	})

	return toAccountEmail(userEmail)
}

export const confirmEmailVerification = async (
	token: string,
): Promise<void> => {
	const verification = await prisma.emailVerificationToken.findUnique({
		where: { tokenHash: hashSecret(token) },
	})
	if (
		!verification ||
		verification.consumedAt ||
		verification.expiresAt <= new Date()
	) {
		throw createError({
			statusCode: 400,
			statusMessage: 'EMAIL_VERIFICATION_INVALID',
		})
	}
	await prisma.$transaction(async (tx) => {
		await tx.emailVerificationToken.update({
			where: { id: verification.id },
			data: { consumedAt: new Date() },
		})
		const primaryCount = await tx.userEmail.count({
			where: { userId: verification.userId, isPrimary: true },
		})
		await tx.userEmail.update({
			where: { id: verification.userEmailId },
			data: {
				verifiedAt: new Date(),
				isPrimary: primaryCount === 0 ? true : undefined,
			},
		})
	})
}

export const setPrimaryEmail = async (
	currentUser: AuthUser,
	emailId: string,
): Promise<AccountEmail[]> => {
	const email = await prisma.userEmail.findFirst({
		where: { id: emailId, userId: currentUser.id, verifiedAt: { not: null } },
	})
	if (!email) {
		throw createError({ statusCode: 404, statusMessage: 'EMAIL_NOT_FOUND' })
	}
	await prisma.$transaction([
		prisma.userEmail.updateMany({
			where: { userId: currentUser.id, isPrimary: true },
			data: { isPrimary: false },
		}),
		prisma.userEmail.update({
			where: { id: email.id },
			data: { isPrimary: true },
		}),
	])
	const emails = await prisma.userEmail.findMany({
		where: { userId: currentUser.id },
		orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
	})
	return emails.map(toAccountEmail)
}

export const deleteAccountEmail = async (
	currentUser: AuthUser,
	emailId: string,
): Promise<{ id: string }> => {
	const email = await prisma.userEmail.findFirst({
		where: { id: emailId, userId: currentUser.id },
	})
	if (!email) {
		throw createError({ statusCode: 404, statusMessage: 'EMAIL_NOT_FOUND' })
	}
	await prisma.$transaction(async (tx) => {
		await tx.userEmail.delete({ where: { id: email.id } })
		if (!email.isPrimary) return
		const replacement = await tx.userEmail.findFirst({
			where: { userId: currentUser.id, verifiedAt: { not: null } },
			orderBy: { createdAt: 'asc' },
		})
		if (replacement) {
			await tx.userEmail.update({
				where: { id: replacement.id },
				data: { isPrimary: true },
			})
			return
		}
	})
	return { id: email.id }
}

export const disconnectIdentity = async (
	currentUser: AuthUser,
	provider: OAuthProvider,
): Promise<AuthUser> => {
	const identities = await prisma.oAuthIdentity.findMany({
		where: { userId: currentUser.id },
		orderBy: { createdAt: 'asc' },
	})
	if (identities.length <= 1) {
		throw createError({
			statusCode: 400,
			statusMessage: 'LAST_IDENTITY_CANNOT_DISCONNECT',
		})
	}
	const identity = identities.find((item) => item.provider === provider)
	if (!identity) {
		throw createError({ statusCode: 404, statusMessage: 'IDENTITY_NOT_FOUND' })
	}
	await prisma.$transaction(async (tx) => {
		if (
			(await tx.user.findUnique({ where: { id: currentUser.id } }))
				?.preferredAvatarIdentityId === identity.id
		) {
			await tx.user.update({
				where: { id: currentUser.id },
				data: {
					preferredAvatarIdentityId: identities.find(
						(item) => item.id !== identity.id,
					)?.id,
				},
			})
		}
		await tx.oAuthIdentity.delete({ where: { id: identity.id } })
	})
	return (await getUserById(currentUser.id))!
}

const chooseMergeSurvivor = <
	T extends {
		id: string
		role: UserRole
		isLegacyMigrated: boolean
		createdAt: Date
	},
>(
	a: T,
	b: T,
): [T, T] => {
	if (a.role !== b.role) return a.role === UserRole.ADMIN ? [a, b] : [b, a]
	if (a.isLegacyMigrated !== b.isLegacyMigrated) {
		return a.isLegacyMigrated ? [a, b] : [b, a]
	}
	return a.createdAt <= b.createdAt ? [a, b] : [b, a]
}

export const confirmAccountMerge = async (
	currentUser: AuthUser,
	rawToken: unknown,
): Promise<AuthUser> => {
	const token = typeof rawToken === 'string' ? rawToken : ''
	const ticket = await prisma.accountMergeTicket.findUnique({
		where: { tokenHash: hashSecret(token) },
	})
	if (
		!ticket ||
		ticket.currentUserId !== currentUser.id ||
		ticket.consumedAt ||
		ticket.expiresAt <= new Date()
	) {
		throw createError({
			statusCode: 400,
			statusMessage: 'MERGE_TICKET_INVALID',
		})
	}
	const accounts = await prisma.user.findMany({
		where: { id: { in: [ticket.currentUserId, ticket.targetUserId] } },
		include: { identities: true, emails: true, notificationPreference: true },
	})
	if (accounts.length !== 2) {
		throw createError({
			statusCode: 404,
			statusMessage: 'MERGE_ACCOUNT_NOT_FOUND',
		})
	}
	const targetAccount = accounts.find(
		(account) => account.id === ticket.targetUserId,
	)
	const ticketIdentity = targetAccount?.identities.find(
		(identity) =>
			identity.provider === ticket.provider &&
			identity.providerUserId === ticket.providerUserId,
	)
	if (!ticketIdentity) {
		throw createError({
			statusCode: 400,
			statusMessage: 'MERGE_TICKET_INVALID',
		})
	}
	const [survivor, source] = chooseMergeSurvivor(accounts[0]!, accounts[1]!)
	const survivorProviders = new Map(
		survivor.identities.map((identity) => [identity.provider, identity]),
	)
	for (const identity of source.identities) {
		const conflict = survivorProviders.get(identity.provider)
		if (conflict && conflict.providerUserId !== identity.providerUserId) {
			throw createError({
				statusCode: 409,
				statusMessage: 'MERGE_PROVIDER_CONFLICT',
			})
		}
	}

	await prisma.$transaction(async (tx) => {
		if (survivor.emails.some((email) => email.isPrimary)) {
			await tx.userEmail.updateMany({
				where: { userId: source.id, isPrimary: true },
				data: { isPrimary: false },
			})
		}
		const sourceLikes = await tx.messageCommentLike.findMany({
			where: { userId: source.id },
		})
		for (const like of sourceLikes) {
			const duplicate = await tx.messageCommentLike.findFirst({
				where: { commentId: like.commentId, userId: survivor.id },
			})
			if (duplicate) {
				await tx.messageCommentLike.delete({ where: { id: like.id } })
			} else {
				await tx.messageCommentLike.update({
					where: { id: like.id },
					data: { userId: survivor.id },
				})
			}
		}

		await Promise.all([
			tx.messageComment.updateMany({
				where: { authorUserId: source.id },
				data: { authorUserId: survivor.id },
			}),
			tx.friendLink.updateMany({
				where: { createdByUserId: source.id },
				data: { createdByUserId: survivor.id },
			}),
			tx.friendLink.updateMany({
				where: { approvedByUserId: source.id },
				data: { approvedByUserId: survivor.id },
			}),
			tx.friendLinkApplication.updateMany({
				where: { applicantUserId: source.id },
				data: { applicantUserId: survivor.id },
			}),
			tx.friendLinkApplication.updateMany({
				where: { approvedByUserId: source.id },
				data: { approvedByUserId: survivor.id },
			}),
			tx.userSession.updateMany({
				where: { userId: source.id },
				data: { userId: survivor.id },
			}),
			tx.userEmail.updateMany({
				where: { userId: source.id },
				data: { userId: survivor.id },
			}),
		])

		for (const identity of source.identities) {
			const duplicate = survivorProviders.get(identity.provider)
			if (duplicate) {
				await tx.oAuthIdentity.delete({ where: { id: identity.id } })
			} else {
				await tx.oAuthIdentity.update({
					where: { id: identity.id },
					data: { userId: survivor.id },
				})
			}
		}

		const mergedPreferences = {
			replyEmailEnabled:
				Boolean(survivor.notificationPreference?.replyEmailEnabled) ||
				Boolean(source.notificationPreference?.replyEmailEnabled),
			adminCommentEmailEnabled:
				Boolean(survivor.notificationPreference?.adminCommentEmailEnabled) ||
				Boolean(source.notificationPreference?.adminCommentEmailEnabled),
			adminFriendLinkEmailEnabled:
				Boolean(survivor.notificationPreference?.adminFriendLinkEmailEnabled) ||
				Boolean(source.notificationPreference?.adminFriendLinkEmailEnabled),
		}
		await tx.userNotificationPreference.deleteMany({
			where: { userId: source.id },
		})
		await tx.userNotificationPreference.upsert({
			where: { userId: survivor.id },
			create: { userId: survivor.id, ...mergedPreferences },
			update: mergedPreferences,
		})
		await tx.user.update({
			where: { id: source.id },
			data: {
				status: UserStatus.MERGED,
				mergedIntoUserId: survivor.id,
				preferredAvatarIdentityId: null,
			},
		})
		const claimedTicket = await tx.accountMergeTicket.updateMany({
			where: { id: ticket.id, consumedAt: null },
			data: { consumedAt: new Date() },
		})
		if (claimedTicket.count !== 1) {
			throw createError({
				statusCode: 400,
				statusMessage: 'MERGE_TICKET_INVALID',
			})
		}
		await tx.accountMergeAudit.create({
			data: {
				sourceUserId: source.id,
				survivorUserId: survivor.id,
				provider: ticket.provider,
				providerUserId: ticket.providerUserId,
			},
		})
		await insertDomainEvent(
			tx,
			DOMAIN_EVENT_NAMES.ACCOUNT_MERGED,
			survivor.id,
			{
				sourceUserId: source.id,
				survivorUserId: survivor.id,
			},
		)
	})

	return (await getUserById(survivor.id))!
}
