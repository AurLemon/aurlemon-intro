import crypto from 'node:crypto'
import { getDefaultResultOrder, promises as dnsPromises } from 'node:dns'
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
const GITHUB_OAUTH_DIAG_HOSTS = ['github.com', 'api.github.com'] as const
const RETRYABLE_GITHUB_NETWORK_ERROR_NAMES = new Set([
	'AbortError',
	'TimeoutError',
	'FetchError',
	'TypeError',
])
const RETRYABLE_GITHUB_NETWORK_MESSAGE_PATTERNS = [
	'fetch failed',
	'timeout',
	'timed out',
	'network',
	'socket',
	'connect',
	'reset',
	'enotfound',
	'eai_again',
] as const
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

const buildGithubRequestMeta = (
	attempt: number,
	startedAt: number,
): GithubRequestMeta => ({
	attemptCount: attempt + 1,
	retryCount: attempt,
	durationMs: Date.now() - startedAt,
})

interface GithubFetchErrorShape {
	code?: string
	name?: string
	message?: string
	cause?: {
		code?: string
		name?: string
		message?: string
	}
}

interface GithubLookupDiagnostic {
	hostname: string
	addresses?: {
		address: string
		family: number
	}[]
	lookupError?: {
		code?: string
		name?: string
		message?: string
	}
}

interface GithubNetworkDiagnostic {
	dnsDefaultResultOrder?: string
	lookups: GithubLookupDiagnostic[]
}

interface GithubRequestMeta {
	attemptCount: number
	retryCount: number
	durationMs: number
}

interface FetchWithRetryResult<T> {
	data: T
	requestMeta: GithubRequestMeta
}

interface GithubTokenExchangeResult {
	accessToken: string
	requestMeta: GithubRequestMeta
}

interface GithubUserFetchResult {
	user: GithubUserResponse
	requestMeta: GithubRequestMeta
}

const getErrorCode = (error: unknown): string | undefined => {
	if (!error || typeof error !== 'object') {
		return undefined
	}

	const maybeError = error as GithubFetchErrorShape

	return maybeError.cause?.code ?? maybeError.code
}

const getErrorName = (error: unknown): string | undefined => {
	if (!error || typeof error !== 'object') {
		return undefined
	}

	const maybeError = error as GithubFetchErrorShape

	return maybeError.cause?.name ?? maybeError.name
}

const getErrorMessage = (error: unknown): string | undefined => {
	if (!error || typeof error !== 'object') {
		return undefined
	}

	const maybeError = error as GithubFetchErrorShape

	return maybeError.cause?.message ?? maybeError.message
}

const toBasicErrorInfo = (error: unknown) => ({
	code: getErrorCode(error),
	name: getErrorName(error),
	message: getErrorMessage(error),
})

const resolveLookupDiagnostic = async (
	hostname: string,
): Promise<GithubLookupDiagnostic> => {
	try {
		const addresses = await dnsPromises.lookup(hostname, { all: true })

		return {
			hostname,
			addresses: addresses.map((item) => ({
				address: item.address,
				family: item.family,
			})),
		}
	} catch (error) {
		return {
			hostname,
			lookupError: toBasicErrorInfo(error),
		}
	}
}

const resolveGithubNetworkDiagnostic =
	async (): Promise<GithubNetworkDiagnostic> => {
		let dnsDefaultResultOrder: string | undefined

		try {
			dnsDefaultResultOrder = getDefaultResultOrder()
		} catch {
			dnsDefaultResultOrder = undefined
		}

		const lookups = await Promise.all(
			GITHUB_OAUTH_DIAG_HOSTS.map((hostname) =>
				resolveLookupDiagnostic(hostname),
			),
		)

		return {
			dnsDefaultResultOrder,
			lookups,
		}
	}

const isRetryableGithubNetworkError = (error: unknown): boolean => {
	const code = getErrorCode(error)

	if (RETRYABLE_GITHUB_NETWORK_CODES.has(code ?? '')) {
		return true
	}

	const errorName = getErrorName(error)

	if (RETRYABLE_GITHUB_NETWORK_ERROR_NAMES.has(errorName ?? '')) {
		return true
	}

	const errorMessage = (getErrorMessage(error) ?? '').toLowerCase()

	if (!errorMessage) {
		return false
	}

	return RETRYABLE_GITHUB_NETWORK_MESSAGE_PATTERNS.some((pattern) =>
		errorMessage.includes(pattern),
	)
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
): Promise<FetchWithRetryResult<T>> => {
	let lastError: unknown
	const startedAt = Date.now()

	for (let attempt = 0; attempt <= retries; attempt++) {
		try {
			const data = (await $fetch<T>(url, {
				...options,
				timeout: options?.timeout ?? GITHUB_FETCH_TIMEOUT,
				retry: 0,
			})) as T

			return {
				data,
				requestMeta: buildGithubRequestMeta(attempt, startedAt),
			}
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

export const exchangeGithubCode = async (
	code: string,
): Promise<GithubTokenExchangeResult> => {
	const githubClientId = process.env.GITHUB_CLIENT_ID ?? ''
	const githubClientSecret = process.env.GITHUB_CLIENT_SECRET ?? ''
	const githubCallbackUrl = process.env.GITHUB_CALLBACK_URL ?? ''

	if (!githubClientId || !githubClientSecret || !githubCallbackUrl) {
		throw createError({
			statusCode: 500,
			statusMessage: GITHUB_OAUTH_ERROR_CODES.NOT_CONFIGURED,
		})
	}

	let tokenExchangeResult: FetchWithRetryResult<GithubAccessTokenResponse>

	try {
		tokenExchangeResult = await fetchWithRetry<GithubAccessTokenResponse>(
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
		const errorName = getErrorName(error)
		const errorMessage = getErrorMessage(error)
		const upstreamStatus = resolveFetchErrorStatus(error)
		const upstreamData = resolveFetchErrorData(error)
		const networkDiagnostic = await resolveGithubNetworkDiagnostic()

		if (isRetryableGithubNetworkError(error)) {
			console.error('[auth/github] token exchange network error', {
				errorCode,
				errorName,
				errorMessage,
				upstreamStatus,
				networkDiagnostic,
			})

			throw createError({
				statusCode: 503,
				statusMessage: GITHUB_OAUTH_ERROR_CODES.NETWORK_ERROR,
			})
		}

		console.error('[auth/github] token exchange provider error', {
			errorCode,
			errorName,
			errorMessage,
			upstreamStatus,
			upstreamData,
			networkDiagnostic,
		})

		throw createError({
			statusCode: 502,
			statusMessage: GITHUB_OAUTH_ERROR_CODES.PROVIDER_ERROR,
		})
	}

	const tokenResponse = tokenExchangeResult.data

	if (!tokenResponse.access_token) {
		throw createError({
			statusCode: 401,
			statusMessage: GITHUB_OAUTH_ERROR_CODES.TOKEN_EXCHANGE_FAILED,
		})
	}

	return {
		accessToken: tokenResponse.access_token,
		requestMeta: tokenExchangeResult.requestMeta,
	}
}

export const fetchGithubUser = async (
	accessToken: string,
): Promise<GithubUserFetchResult> => {
	let githubUserResult: FetchWithRetryResult<GithubUserResponse>

	try {
		githubUserResult = await fetchWithRetry<GithubUserResponse>(
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
		const errorName = getErrorName(error)
		const errorMessage = getErrorMessage(error)
		const upstreamStatus = resolveFetchErrorStatus(error)
		const upstreamData = resolveFetchErrorData(error)
		const networkDiagnostic = await resolveGithubNetworkDiagnostic()

		if (isRetryableGithubNetworkError(error)) {
			console.error('[auth/github] user info network error', {
				errorCode,
				errorName,
				errorMessage,
				upstreamStatus,
				networkDiagnostic,
			})

			throw createError({
				statusCode: 503,
				statusMessage: GITHUB_OAUTH_ERROR_CODES.NETWORK_ERROR,
			})
		}

		console.error('[auth/github] user info provider error', {
			errorCode,
			errorName,
			errorMessage,
			upstreamStatus,
			upstreamData,
			networkDiagnostic,
		})

		throw createError({
			statusCode: 502,
			statusMessage: GITHUB_OAUTH_ERROR_CODES.PROVIDER_ERROR,
		})
	}

	const githubUser = githubUserResult.data

	if (!githubUser.login || !githubUser.avatar_url || !githubUser.html_url) {
		throw createError({
			statusCode: 401,
			statusMessage: GITHUB_OAUTH_ERROR_CODES.USER_PAYLOAD_INVALID,
		})
	}

	return {
		user: githubUser,
		requestMeta: githubUserResult.requestMeta,
	}
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
