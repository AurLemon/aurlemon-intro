import crypto from 'node:crypto'
import type { H3Event } from 'h3'
import prisma from '~/lib/prisma'
import type { GithubAuthUser } from '~/shared/types/social'

const SESSION_COOKIE_NAME = 'aurlemon_session'
const OAUTH_STATE_COOKIE_NAME = 'aurlemon_github_state'
const OAUTH_REDIRECT_COOKIE_NAME = 'aurlemon_github_redirect'
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7

interface GithubAccessTokenResponse {
	access_token?: string
}

interface GithubUserResponse {
	login: string
	avatar_url: string
	html_url: string
}

const GITHUB_FETCH_TIMEOUT = 20_000
const GITHUB_FETCH_RETRIES = 2
const GITHUB_RETRY_DELAYS = [400, 1000]
const RETRYABLE_GITHUB_NETWORK_CODES = new Set([
	'UND_ERR_CONNECT_TIMEOUT',
	'UND_ERR_CONNECT_ERROR',
	'UND_ERR_HEADERS_TIMEOUT',
	'UND_ERR_BODY_TIMEOUT',
	'UND_ERR_ABORTED',
	'UND_ERR_SOCKET',
	'ECONNRESET',
	'ECONNREFUSED',
	'ETIMEDOUT',
	'EAI_AGAIN',
	'ENOTFOUND',
	'ENETUNREACH',
	'EHOSTUNREACH',
])

export const GITHUB_OAUTH_ERROR_CODES = {
	NOT_CONFIGURED: 'GITHUB_OAUTH_NOT_CONFIGURED',
	NETWORK_ERROR: 'GITHUB_OAUTH_NETWORK_ERROR',
	PROVIDER_ERROR: 'GITHUB_OAUTH_PROVIDER_ERROR',
	TOKEN_EXCHANGE_FAILED: 'GITHUB_OAUTH_TOKEN_EXCHANGE_FAILED',
	USER_PAYLOAD_INVALID: 'GITHUB_OAUTH_USER_PAYLOAD_INVALID',
	CALLBACK_FAILED: 'GITHUB_OAUTH_CALLBACK_FAILED',
} as const

const retryDelay = (ms: number) =>
	new Promise((resolve) => setTimeout(resolve, ms))

const getErrorCode = (error: unknown): string | undefined => {
	if (!error || typeof error !== 'object') {
		return undefined
	}

	const maybeError = error as {
		code?: string
		cause?: {
			code?: string
		}
	}

	return maybeError.cause?.code ?? maybeError.code
}

const isRetryableGithubNetworkError = (error: unknown): boolean => {
	const code = getErrorCode(error)
	return RETRYABLE_GITHUB_NETWORK_CODES.has(code ?? '')
}

const resolveFetchErrorStatus = (error: unknown): number | undefined => {
	if (!error || typeof error !== 'object') {
		return undefined
	}

	const maybeError = error as {
		statusCode?: number
		status?: number
		response?: {
			status?: number
		}
	}

	return (
		maybeError.response?.status ?? maybeError.statusCode ?? maybeError.status
	)
}

const resolveFetchErrorData = (error: unknown): unknown => {
	if (!error || typeof error !== 'object') {
		return undefined
	}

	const maybeError = error as {
		data?: unknown
		response?: {
			_data?: unknown
		}
	}

	return maybeError.response?._data ?? maybeError.data
}

const fetchWithRetry = async <T>(
	url: string,
	options: Parameters<typeof $fetch<T>>[1],
	retries = GITHUB_FETCH_RETRIES,
): Promise<T> => {
	let lastError: unknown

	for (let attempt = 0; attempt <= retries; attempt++) {
		try {
			return (await $fetch<T>(url, {
				...options,
				timeout: options?.timeout ?? GITHUB_FETCH_TIMEOUT,
				retry: 0,
			})) as T
		} catch (error) {
			lastError = error

			if (attempt >= retries || !isRetryableGithubNetworkError(error)) {
				throw error
			}

			await retryDelay(GITHUB_RETRY_DELAYS[attempt] ?? 1500)
		}
	}

	throw lastError
}

const buildCookieOptions = (maxAgeSeconds: number) => ({
	httpOnly: true,
	sameSite: 'lax' as const,
	secure: process.env.NODE_ENV === 'production',
	path: '/',
	maxAge: maxAgeSeconds,
})

export const getAdminGithubLogins = (): string[] => {
	return (process.env.ADMIN_GITHUB_IDS ?? 'AurLemon')
		.split(',')
		.map((item: string) => item.trim())
		.filter(Boolean)
}

export const isAdminGithubLogin = (githubLogin: string): boolean => {
	return getAdminGithubLogins().includes(githubLogin)
}

export const buildGithubProfileUrl = (githubLogin: string): string => {
	return `https://github.com/${githubLogin}`
}

export const createGithubOAuthUrl = (event: H3Event): string => {
	const githubClientId = process.env.GITHUB_CLIENT_ID ?? ''
	const githubCallbackUrl = process.env.GITHUB_CALLBACK_URL ?? ''

	if (!githubClientId || !githubCallbackUrl) {
		throw createError({
			statusCode: 500,
			statusMessage: GITHUB_OAUTH_ERROR_CODES.NOT_CONFIGURED,
		})
	}

	const redirect = getQuery(event).redirect
	const state = crypto.randomUUID()
	const authorizeUrl = new URL('https://github.com/login/oauth/authorize')

	authorizeUrl.searchParams.set('client_id', githubClientId)
	authorizeUrl.searchParams.set('redirect_uri', githubCallbackUrl)
	authorizeUrl.searchParams.set('scope', 'read:user')
	authorizeUrl.searchParams.set('state', state)

	setCookie(event, OAUTH_STATE_COOKIE_NAME, state, buildCookieOptions(600))

	if (typeof redirect === 'string' && redirect.startsWith('/')) {
		setCookie(
			event,
			OAUTH_REDIRECT_COOKIE_NAME,
			redirect,
			buildCookieOptions(600),
		)
	}

	return authorizeUrl.toString()
}

export const exchangeGithubCode = async (code: string): Promise<string> => {
	const githubClientId = process.env.GITHUB_CLIENT_ID ?? ''
	const githubClientSecret = process.env.GITHUB_CLIENT_SECRET ?? ''
	const githubCallbackUrl = process.env.GITHUB_CALLBACK_URL ?? ''

	if (!githubClientId || !githubClientSecret || !githubCallbackUrl) {
		throw createError({
			statusCode: 500,
			statusMessage: GITHUB_OAUTH_ERROR_CODES.NOT_CONFIGURED,
		})
	}

	let tokenResponse: GithubAccessTokenResponse

	try {
		tokenResponse = await fetchWithRetry<GithubAccessTokenResponse>(
			'https://github.com/login/oauth/access_token',
			{
				method: 'POST',
				headers: {
					accept: 'application/json',
					'content-type': 'application/x-www-form-urlencoded',
				},
				body: new URLSearchParams({
					client_id: githubClientId,
					client_secret: githubClientSecret,
					code,
					redirect_uri: githubCallbackUrl,
				}).toString(),
			},
		)
	} catch (error) {
		const errorCode = getErrorCode(error)
		const upstreamStatus = resolveFetchErrorStatus(error)
		const upstreamData = resolveFetchErrorData(error)

		if (isRetryableGithubNetworkError(error)) {
			console.error('[auth/github] token exchange network error', {
				errorCode,
				upstreamStatus,
			})

			throw createError({
				statusCode: 503,
				statusMessage: GITHUB_OAUTH_ERROR_CODES.NETWORK_ERROR,
			})
		}

		console.error('[auth/github] token exchange provider error', {
			errorCode,
			upstreamStatus,
			upstreamData,
		})

		throw createError({
			statusCode: 502,
			statusMessage: GITHUB_OAUTH_ERROR_CODES.PROVIDER_ERROR,
		})
	}

	if (!tokenResponse.access_token) {
		throw createError({
			statusCode: 401,
			statusMessage: GITHUB_OAUTH_ERROR_CODES.TOKEN_EXCHANGE_FAILED,
		})
	}

	return tokenResponse.access_token
}

export const fetchGithubUser = async (
	accessToken: string,
): Promise<GithubUserResponse> => {
	let githubUser: GithubUserResponse

	try {
		githubUser = await fetchWithRetry<GithubUserResponse>(
			'https://api.github.com/user',
			{
				headers: {
					authorization: `Bearer ${accessToken}`,
					accept: 'application/vnd.github+json',
					'user-agent': 'AurLemon-Intro',
				},
			},
		)
	} catch (error) {
		const errorCode = getErrorCode(error)
		const upstreamStatus = resolveFetchErrorStatus(error)
		const upstreamData = resolveFetchErrorData(error)

		if (isRetryableGithubNetworkError(error)) {
			console.error('[auth/github] user info network error', {
				errorCode,
				upstreamStatus,
			})

			throw createError({
				statusCode: 503,
				statusMessage: GITHUB_OAUTH_ERROR_CODES.NETWORK_ERROR,
			})
		}

		console.error('[auth/github] user info provider error', {
			errorCode,
			upstreamStatus,
			upstreamData,
		})

		throw createError({
			statusCode: 502,
			statusMessage: GITHUB_OAUTH_ERROR_CODES.PROVIDER_ERROR,
		})
	}

	if (!githubUser.login || !githubUser.avatar_url || !githubUser.html_url) {
		throw createError({
			statusCode: 401,
			statusMessage: GITHUB_OAUTH_ERROR_CODES.USER_PAYLOAD_INVALID,
		})
	}

	return githubUser
}

export const createGithubSession = async (
	event: H3Event,
	user: GithubUserResponse,
): Promise<GithubAuthUser> => {
	const sessionToken = crypto.randomUUID()
	const expiresAt = new Date(Date.now() + SESSION_TTL_MS)

	await prisma.githubSession.create({
		data: {
			sessionToken,
			githubLogin: user.login,
			avatarUrl: user.avatar_url,
			profileUrl: user.html_url,
			expiresAt,
		},
	})

	setCookie(
		event,
		SESSION_COOKIE_NAME,
		sessionToken,
		buildCookieOptions(Math.floor(SESSION_TTL_MS / 1000)),
	)

	return {
		githubLogin: user.login,
		avatarUrl: user.avatar_url,
		profileUrl: user.html_url,
		isAdmin: isAdminGithubLogin(user.login),
	}
}

export const clearGithubSession = async (event: H3Event): Promise<void> => {
	const sessionToken = getCookie(event, SESSION_COOKIE_NAME)

	if (sessionToken) {
		await prisma.githubSession.deleteMany({
			where: {
				sessionToken,
			},
		})
	}

	deleteCookie(event, SESSION_COOKIE_NAME, { path: '/' })
}

export const getGithubSession = async (
	event: H3Event,
): Promise<GithubAuthUser | null> => {
	const sessionToken = getCookie(event, SESSION_COOKIE_NAME)

	if (!sessionToken) {
		return null
	}

	const session = await prisma.githubSession.findUnique({
		where: {
			sessionToken,
		},
	})

	if (!session || session.expiresAt <= new Date()) {
		if (sessionToken) {
			deleteCookie(event, SESSION_COOKIE_NAME, { path: '/' })
		}

		if (session) {
			await prisma.githubSession.delete({
				where: {
					id: session.id,
				},
			})
		}

		return null
	}

	return {
		githubLogin: session.githubLogin,
		avatarUrl: session.avatarUrl,
		profileUrl: session.profileUrl,
		isAdmin: isAdminGithubLogin(session.githubLogin),
	}
}

export const requireGithubSession = async (
	event: H3Event,
): Promise<GithubAuthUser> => {
	const session = await getGithubSession(event)

	if (!session) {
		throw createError({
			statusCode: 401,
			statusMessage: 'AUTH_REQUIRED',
		})
	}

	return session
}

export const requireAdminSession = async (
	event: H3Event,
): Promise<GithubAuthUser> => {
	const session = await requireGithubSession(event)

	if (!session.isAdmin) {
		throw createError({
			statusCode: 403,
			statusMessage: 'ADMIN_REQUIRED',
		})
	}

	return session
}

export const consumeGithubOAuthState = (event: H3Event): string | null => {
	const state = getCookie(event, OAUTH_STATE_COOKIE_NAME) ?? null
	deleteCookie(event, OAUTH_STATE_COOKIE_NAME, { path: '/' })
	return state
}

export const consumeGithubOAuthRedirect = (event: H3Event): string => {
	const redirect = getCookie(event, OAUTH_REDIRECT_COOKIE_NAME) ?? '/'
	deleteCookie(event, OAUTH_REDIRECT_COOKIE_NAME, { path: '/' })
	return redirect.startsWith('/') ? redirect : '/'
}
