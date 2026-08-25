import crypto from 'node:crypto'
import {
	EmailSource,
	OAuthIntent,
	OAuthProvider,
	UserRole,
	UserStatus,
} from '@prisma/client'
import type { Prisma } from '@prisma/client'
import type { H3Event } from 'h3'
import prisma from '~/lib/prisma'
import {
	DOMAIN_EVENT_NAMES,
	insertDomainEvent,
} from '~/server/utils/domain-events'
import {
	getOAuthProviderAdapter,
	type NormalizedOAuthIdentity,
} from '~/server/utils/oauth-providers'
import type { AuthIdentity, AuthUser } from '~/shared/types/social'

const SESSION_COOKIE_NAME = 'aurlemon_session'
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7
const OAUTH_TRANSACTION_TTL_MS = 1000 * 60 * 10
const MERGE_TICKET_TTL_MS = 1000 * 60 * 10
const HANDLE_PATTERN = /^[A-Za-z0-9_-]{1,39}$/

export interface OAuthCompletionResult {
	redirectPath: string
	mergeToken: string | null
	user: AuthUser | null
	intent: OAuthIntent
}

const normalize = (value: string): string => value.trim().toLowerCase()

export const hashSecret = (value: string): string =>
	crypto.createHash('sha256').update(value).digest('hex')

const randomSecret = (): string => crypto.randomBytes(32).toString('base64url')

const cookieOptions = (maxAgeSeconds: number) => ({
	httpOnly: true,
	sameSite: 'lax' as const,
	secure: process.env.NODE_ENV === 'production',
	path: '/',
	maxAge: maxAgeSeconds,
})

const sanitizeRedirectPath = (value: unknown): string =>
	typeof value === 'string' && value.startsWith('/') && !value.startsWith('//')
		? value
		: '/'

const toAuthIdentity = (identity: {
	id: string
	provider: OAuthProvider
	providerUsername: string
	providerDisplayName: string | null
	avatarUrl: string
	profileUrl: string
}): AuthIdentity => ({
	id: identity.id,
	provider: identity.provider,
	providerUsername: identity.providerUsername,
	displayName: identity.providerDisplayName,
	avatarUrl: identity.avatarUrl,
	profileUrl: identity.profileUrl,
})

const AUTH_USER_INCLUDE = {
	identities: {
		orderBy: { createdAt: 'asc' as const },
	},
	emails: {
		where: {
			isPrimary: true,
			verifiedAt: { not: null },
		},
		select: { id: true },
	},
} satisfies Prisma.UserInclude

type UserWithIdentities = Prisma.UserGetPayload<{
	include: typeof AUTH_USER_INCLUDE
}>

export const toAuthUser = (user: UserWithIdentities): AuthUser => {
	const preferred =
		user.identities.find(
			(identity) => identity.id === user.preferredAvatarIdentityId,
		) ?? user.identities[0]

	return {
		id: user.id,
		username: user.username,
		displayName: user.displayName,
		avatarUrl: preferred?.avatarUrl ?? '',
		hasVerifiedPrimaryEmail: user.emails.length > 0,
		preferredAvatarIdentityId: user.preferredAvatarIdentityId,
		preferredLocale: user.preferredLocale,
		isAdmin: user.role === UserRole.ADMIN,
		identities: user.identities.map(toAuthIdentity),
	}
}

export const getUserById = async (userId: string): Promise<AuthUser | null> => {
	const user = await prisma.user.findUnique({
		where: { id: userId },
		include: AUTH_USER_INCLUDE,
	})

	if (!user || user.status !== UserStatus.ACTIVE) {
		return null
	}

	return toAuthUser(user)
}

export const getUserSession = async (
	event: H3Event,
): Promise<AuthUser | null> => {
	const token = getCookie(event, SESSION_COOKIE_NAME)

	if (!token) {
		return null
	}

	const tokenHash = hashSecret(token)
	const session = await prisma.userSession.findUnique({
		where: { tokenHash },
		include: {
			user: { include: AUTH_USER_INCLUDE },
		},
	})

	if (!session || session.expiresAt <= new Date()) {
		if (session) {
			await prisma.userSession.deleteMany({ where: { id: session.id } })
		}
		deleteCookie(event, SESSION_COOKIE_NAME, { path: '/' })
		return null
	}

	let user = session.user
	if (user.status === UserStatus.MERGED && user.mergedIntoUserId) {
		const mergedInto = await prisma.user.findUnique({
			where: { id: user.mergedIntoUserId },
			include: AUTH_USER_INCLUDE,
		})
		if (mergedInto) {
			await prisma.userSession.update({
				where: { id: session.id },
				data: { userId: mergedInto.id },
			})
			user = mergedInto
		}
	}

	if (user.status !== UserStatus.ACTIVE) {
		deleteCookie(event, SESSION_COOKIE_NAME, { path: '/' })
		return null
	}

	if (Date.now() - session.lastSeenAt.getTime() > 5 * 60 * 1000) {
		void prisma.userSession
			.update({ where: { id: session.id }, data: { lastSeenAt: new Date() } })
			.catch(() => undefined)
	}

	return toAuthUser(user)
}

export const requireUserSession = async (event: H3Event): Promise<AuthUser> => {
	const user = await getUserSession(event)
	if (!user) {
		throw createError({ statusCode: 401, statusMessage: 'AUTH_REQUIRED' })
	}
	return user
}

export const requireAdminUser = async (event: H3Event): Promise<AuthUser> => {
	const user = await requireUserSession(event)
	if (!user.isAdmin) {
		throw createError({ statusCode: 403, statusMessage: 'ADMIN_REQUIRED' })
	}
	return user
}

const createUserSession = async (
	event: H3Event,
	userId: string,
): Promise<void> => {
	const token = randomSecret()
	await prisma.userSession.create({
		data: {
			userId,
			tokenHash: hashSecret(token),
			expiresAt: new Date(Date.now() + SESSION_TTL_MS),
		},
	})
	setCookie(
		event,
		SESSION_COOKIE_NAME,
		token,
		cookieOptions(Math.floor(SESSION_TTL_MS / 1000)),
	)
}

export const clearUserSession = async (event: H3Event): Promise<void> => {
	const token = getCookie(event, SESSION_COOKIE_NAME)
	if (token) {
		await prisma.userSession.deleteMany({
			where: { tokenHash: hashSecret(token) },
		})
	}
	deleteCookie(event, SESSION_COOKIE_NAME, { path: '/' })
}

const createPkce = () => {
	const verifier = randomSecret()
	const challenge = crypto
		.createHash('sha256')
		.update(verifier)
		.digest('base64url')
	return { verifier, challenge }
}

export const startOAuth = async (
	event: H3Event,
	provider: OAuthProvider,
): Promise<string> => {
	const query = getQuery(event)
	const intent =
		query.intent === 'connect' ? OAuthIntent.CONNECT : OAuthIntent.SIGN_IN
	const currentUser = await getUserSession(event)

	if (intent === OAuthIntent.CONNECT && !currentUser) {
		throw createError({ statusCode: 401, statusMessage: 'AUTH_REQUIRED' })
	}

	const state = randomSecret()
	const redirectPath = sanitizeRedirectPath(query.redirect)
	const pkce = provider === OAuthProvider.GITHUB ? createPkce() : null
	const authorizationUrl = getOAuthProviderAdapter(
		provider,
	).createAuthorizationUrl({
		state,
		codeChallenge: pkce?.challenge ?? null,
	})

	await prisma.oAuthTransaction.create({
		data: {
			stateHash: hashSecret(state),
			provider,
			intent,
			initiatorUserId: currentUser?.id,
			codeVerifier: pkce?.verifier,
			redirectPath,
			expiresAt: new Date(Date.now() + OAUTH_TRANSACTION_TTL_MS),
		},
	})

	return authorizationUrl
}

const createAvailableUsername = async (
	rawUsername: string,
): Promise<string> => {
	const base = HANDLE_PATTERN.test(rawUsername)
		? rawUsername
		: rawUsername.replace(/[^A-Za-z0-9_-]/g, '-').slice(0, 39) || 'user'
	let candidate = base
	let suffix = 1

	while (
		await prisma.user.findUnique({
			where: { usernameNormalized: normalize(candidate) },
			select: { id: true },
		})
	) {
		const marker = `-${suffix}`
		candidate = `${base.slice(0, 39 - marker.length)}${marker}`
		suffix += 1
	}

	return candidate
}

const upsertGithubEmail = async (
	userId: string,
	email: string | null,
): Promise<void> => {
	if (!email) {
		return
	}
	const normalizedEmail = normalize(email)
	const conflict = await prisma.userEmail.findUnique({
		where: { emailNormalized: normalizedEmail },
	})
	if (conflict && conflict.userId !== userId) {
		console.warn('GITHUB_EMAIL_OWNERSHIP_CONFLICT', { userId })
		return
	}
	const primaryCount = await prisma.userEmail.count({
		where: { userId, isPrimary: true },
	})
	await prisma.userEmail.upsert({
		where: { emailNormalized: normalizedEmail },
		create: {
			userId,
			email,
			emailNormalized: normalizedEmail,
			source: EmailSource.GITHUB,
			isPrimary: primaryCount === 0,
			verifiedAt: new Date(),
		},
		update: {
			email,
			source: EmailSource.GITHUB,
			verifiedAt: new Date(),
		},
	})
}

const updateIdentity = async (
	identityId: string,
	identity: NormalizedOAuthIdentity,
) =>
	prisma.oAuthIdentity.update({
		where: { id: identityId },
		data: {
			providerUsername: identity.providerUsername,
			providerUsernameNormalized: normalize(identity.providerUsername),
			providerDisplayName: identity.displayName,
			avatarUrl: identity.avatarUrl,
			profileUrl: identity.profileUrl,
		},
	})

const createUserForIdentity = async (
	identity: NormalizedOAuthIdentity,
): Promise<string> => {
	const username = await createAvailableUsername(identity.providerUsername)
	const adminIdentifiers = new Set(
		(process.env.ADMIN_GITHUB_IDS ?? 'AurLemon')
			.split(',')
			.map(normalize)
			.filter(Boolean),
	)
	const shouldBootstrapAdmin =
		identity.provider === OAuthProvider.GITHUB &&
		(adminIdentifiers.has(normalize(identity.providerUserId)) ||
			adminIdentifiers.has(normalize(identity.providerUsername))) &&
		(await prisma.user.count({ where: { role: UserRole.ADMIN } })) === 0
	const user = await prisma.$transaction(async (tx) => {
		const created = await tx.user.create({
			data: {
				username,
				usernameNormalized: normalize(username),
				displayName: identity.displayName ?? identity.providerUsername,
				role: shouldBootstrapAdmin ? UserRole.ADMIN : UserRole.USER,
				notificationPreference: {
					create: { replyEmailEnabled: true },
				},
				identities: {
					create: {
						provider: identity.provider,
						providerUserId: identity.providerUserId,
						providerUsername: identity.providerUsername,
						providerUsernameNormalized: normalize(identity.providerUsername),
						providerDisplayName: identity.displayName,
						avatarUrl: identity.avatarUrl,
						profileUrl: identity.profileUrl,
					},
				},
			},
			include: AUTH_USER_INCLUDE,
		})
		await tx.user.update({
			where: { id: created.id },
			data: { preferredAvatarIdentityId: created.identities[0]!.id },
		})
		await insertDomainEvent(tx, DOMAIN_EVENT_NAMES.USER_CREATED, created.id, {
			userId: created.id,
			provider: identity.provider,
			providerUserId: identity.providerUserId,
		})
		return created
	})
	return user.id
}

const createMergeTicket = async (
	currentUserId: string,
	targetUserId: string,
	identity: NormalizedOAuthIdentity,
): Promise<string> => {
	const token = randomSecret()
	await prisma.accountMergeTicket.create({
		data: {
			tokenHash: hashSecret(token),
			currentUserId,
			targetUserId,
			provider: identity.provider,
			providerUserId: identity.providerUserId,
			expiresAt: new Date(Date.now() + MERGE_TICKET_TTL_MS),
		},
	})
	return token
}

export const completeOAuth = async (
	event: H3Event,
	provider: OAuthProvider,
): Promise<OAuthCompletionResult> => {
	const query = getQuery(event)
	const code = typeof query.code === 'string' ? query.code : ''
	const state = typeof query.state === 'string' ? query.state : ''
	if (!code || !state) {
		throw createError({ statusCode: 401, statusMessage: 'INVALID_OAUTH_STATE' })
	}

	const transaction = await prisma.oAuthTransaction.findUnique({
		where: { stateHash: hashSecret(state) },
	})
	if (
		!transaction ||
		transaction.provider !== provider ||
		transaction.consumedAt ||
		transaction.expiresAt <= new Date()
	) {
		throw createError({ statusCode: 401, statusMessage: 'INVALID_OAUTH_STATE' })
	}
	const consumed = await prisma.oAuthTransaction.updateMany({
		where: { id: transaction.id, consumedAt: null },
		data: { consumedAt: new Date() },
	})
	if (consumed.count !== 1) {
		throw createError({ statusCode: 401, statusMessage: 'INVALID_OAUTH_STATE' })
	}

	const currentUser = await getUserSession(event)
	if (
		transaction.intent === OAuthIntent.CONNECT &&
		(!currentUser || currentUser.id !== transaction.initiatorUserId)
	) {
		throw createError({
			statusCode: 401,
			statusMessage: 'OAUTH_CONNECT_SESSION_CHANGED',
		})
	}

	const identity = await getOAuthProviderAdapter(provider).exchangeCode({
		code,
		codeVerifier: transaction.codeVerifier,
	})
	const existingIdentity = await prisma.oAuthIdentity.findUnique({
		where: {
			provider_providerUserId: {
				provider,
				providerUserId: identity.providerUserId,
			},
		},
	})
	let userId: string
	let mergeToken: string | null = null

	if (transaction.intent === OAuthIntent.CONNECT && currentUser) {
		if (existingIdentity && existingIdentity.userId !== currentUser.id) {
			mergeToken = await createMergeTicket(
				currentUser.id,
				existingIdentity.userId,
				identity,
			)
			return {
				redirectPath: transaction.redirectPath,
				mergeToken,
				user: currentUser,
				intent: transaction.intent,
			}
		}

		const sameProvider = await prisma.oAuthIdentity.findUnique({
			where: {
				userId_provider: { userId: currentUser.id, provider },
			},
		})
		if (
			sameProvider &&
			sameProvider.providerUserId !== identity.providerUserId
		) {
			throw createError({
				statusCode: 409,
				statusMessage: 'IDENTITY_PROVIDER_ALREADY_CONNECTED',
			})
		}

		if (existingIdentity) {
			await updateIdentity(existingIdentity.id, identity)
		} else {
			await prisma.oAuthIdentity.create({
				data: {
					userId: currentUser.id,
					provider,
					providerUserId: identity.providerUserId,
					providerUsername: identity.providerUsername,
					providerUsernameNormalized: normalize(identity.providerUsername),
					providerDisplayName: identity.displayName,
					avatarUrl: identity.avatarUrl,
					profileUrl: identity.profileUrl,
				},
			})
		}
		userId = currentUser.id
	} else if (existingIdentity) {
		await updateIdentity(existingIdentity.id, identity)
		userId = existingIdentity.userId
		if (!(await getUserById(userId))) {
			throw createError({ statusCode: 403, statusMessage: 'ACCOUNT_DISABLED' })
		}
		await createUserSession(event, userId)
	} else {
		userId = await createUserForIdentity(identity)
		await createUserSession(event, userId)
	}

	if (provider === OAuthProvider.GITHUB) {
		await upsertGithubEmail(userId, identity.verifiedPrimaryEmail)
	}

	return {
		redirectPath: transaction.redirectPath,
		mergeToken,
		user: await getUserById(userId),
		intent: transaction.intent,
	}
}

export const getLegacySnapshot = (user: AuthUser) => {
	const github = user.identities.find((item) => item.provider === 'GITHUB')
	const primary = github ?? user.identities[0]
	return {
		legacyLogin: github?.providerUsername ?? user.username,
		avatarUrl: user.avatarUrl,
		profileUrl: primary?.profileUrl ?? '',
	}
}
