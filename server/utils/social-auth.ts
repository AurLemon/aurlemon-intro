import { getDefaultResultOrder, promises as dnsPromises } from 'node:dns'
import {
	isGithubProxyEnabled,
	isIntroProxyTransportError,
	proxyIntroRequest,
	resolveIntroProxyBodyText,
	resolveIntroProxyJsonBody,
} from '~/server/utils/intro-proxy'

interface GithubAccessTokenResponse {
	access_token?: string
}

export interface GithubUserResponse {
	id: number
	login: string
	name?: string | null
	avatar_url: string
	html_url: string
}

export interface GithubEmailResponse {
	email: string
	primary: boolean
	verified: boolean
}

const GITHUB_FETCH_TIMEOUT = 20_000
const GITHUB_FETCH_RETRIES = 2
const GITHUB_PROXY_FETCH_TIMEOUT = 9_000
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
	transport: 'direct',
})

const buildProxyRequestMeta = (
	durationMs?: number,
	proxyRequestId?: string,
): GithubRequestMeta => {
	return {
		attemptCount: 1,
		retryCount: 0,
		durationMs: Math.max(0, Math.floor(durationMs ?? 0)),
		transport: 'proxy',
		proxyRequestId,
	}
}

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
	transport: 'direct' | 'proxy'
	proxyRequestId?: string
}

interface FetchWithRetryResult<T> {
	data: T
	requestMeta: GithubRequestMeta
}

export interface GithubTokenExchangeResult {
	accessToken: string
	requestMeta: GithubRequestMeta
}

export interface GithubUserFetchResult {
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

const resolveFetchErrorStatusMessage = (error: unknown): string | undefined => {
	if (!error || typeof error !== 'object') {
		return undefined
	}

	const maybeError = error as {
		statusMessage?: string
		data?: {
			statusMessage?: string
		}
		response?: {
			_data?: {
				statusMessage?: string
			}
		}
	}

	return (
		maybeError.response?._data?.statusMessage ??
		maybeError.data?.statusMessage ??
		maybeError.statusMessage
	)
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

const getGithubCallbackUrl = (): string =>
	process.env.GITHUB_CALLBACK_URL?.trim() ||
	(process.env.NUXT_SITE_URL
		? `${process.env.NUXT_SITE_URL.replace(/\/$/, '')}/api/auth/github/callback`
		: '')

export const exchangeGithubCode = async (
	code: string,
	codeVerifier?: string | null,
): Promise<GithubTokenExchangeResult> => {
	const githubClientId = process.env.GITHUB_CLIENT_ID ?? ''
	const githubClientSecret = process.env.GITHUB_CLIENT_SECRET ?? ''
	const githubCallbackUrl = getGithubCallbackUrl()

	if (!githubClientId || !githubClientSecret || !githubCallbackUrl) {
		throw createError({
			statusCode: 500,
			statusMessage: GITHUB_OAUTH_ERROR_CODES.NOT_CONFIGURED,
		})
	}

	let tokenExchangeResult: FetchWithRetryResult<GithubAccessTokenResponse>
	const useProxy = isGithubProxyEnabled()
	const tokenExchangeBody = new URLSearchParams({
		client_id: githubClientId,
		client_secret: githubClientSecret,
		code,
		redirect_uri: githubCallbackUrl,
		...(codeVerifier ? { code_verifier: codeVerifier } : {}),
	}).toString()

	try {
		if (useProxy) {
			const proxyEnvelope = await proxyIntroRequest({
				url: 'https://github.com/login/oauth/access_token',
				method: 'POST',
				headers: {
					accept: 'application/json',
					'content-type': 'application/x-www-form-urlencoded',
				},
				bodyType: 'raw',
				body: tokenExchangeBody,
				timeoutMs: GITHUB_PROXY_FETCH_TIMEOUT,
				notConfiguredStatusMessage: GITHUB_OAUTH_ERROR_CODES.NOT_CONFIGURED,
			})

			if (!proxyEnvelope.ok) {
				const networkDiagnostic = await resolveGithubNetworkDiagnostic()

				if (isIntroProxyTransportError(proxyEnvelope)) {
					console.error('[auth/github] token exchange network error', {
						transport: 'proxy',
						upstreamStatus: proxyEnvelope.status,
						errorMessage: proxyEnvelope.error,
						proxyRequestId: proxyEnvelope.requestId,
						networkDiagnostic,
					})

					throw createError({
						statusCode: 503,
						statusMessage: GITHUB_OAUTH_ERROR_CODES.NETWORK_ERROR,
					})
				}

				console.error('[auth/github] token exchange provider error', {
					transport: 'proxy',
					upstreamStatus: proxyEnvelope.status,
					upstreamData: resolveIntroProxyBodyText(proxyEnvelope),
					errorMessage: proxyEnvelope.error,
					proxyRequestId: proxyEnvelope.requestId,
					networkDiagnostic,
				})

				throw createError({
					statusCode: 502,
					statusMessage: GITHUB_OAUTH_ERROR_CODES.PROVIDER_ERROR,
				})
			}

			tokenExchangeResult = {
				data: resolveIntroProxyJsonBody<GithubAccessTokenResponse>(
					proxyEnvelope,
				),
				requestMeta: buildProxyRequestMeta(
					proxyEnvelope.durationMs,
					proxyEnvelope.requestId,
				),
			}
		} else {
			tokenExchangeResult = await fetchWithRetry<GithubAccessTokenResponse>(
				'https://github.com/login/oauth/access_token',
				{
					method: 'POST',
					headers: {
						accept: 'application/json',
						'content-type': 'application/x-www-form-urlencoded',
					},
					body: tokenExchangeBody,
				},
			)
		}
	} catch (error) {
		const statusMessage = resolveFetchErrorStatusMessage(error)

		if (
			statusMessage === GITHUB_OAUTH_ERROR_CODES.NOT_CONFIGURED ||
			statusMessage === GITHUB_OAUTH_ERROR_CODES.NETWORK_ERROR ||
			statusMessage === GITHUB_OAUTH_ERROR_CODES.PROVIDER_ERROR
		) {
			throw error
		}

		const errorCode = getErrorCode(error)
		const errorName = getErrorName(error)
		const errorMessage = getErrorMessage(error)
		const upstreamStatus = resolveFetchErrorStatus(error)
		const upstreamData = resolveFetchErrorData(error)
		const networkDiagnostic = await resolveGithubNetworkDiagnostic()

		if (isRetryableGithubNetworkError(error)) {
			console.error('[auth/github] token exchange network error', {
				transport: useProxy ? 'proxy' : 'direct',
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
			transport: useProxy ? 'proxy' : 'direct',
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
	const useProxy = isGithubProxyEnabled()

	try {
		if (useProxy) {
			const proxyEnvelope = await proxyIntroRequest({
				url: 'https://api.github.com/user',
				method: 'GET',
				headers: {
					authorization: `Bearer ${accessToken}`,
					accept: 'application/vnd.github+json',
					'user-agent': 'AurLemon-Intro',
				},
				timeoutMs: GITHUB_PROXY_FETCH_TIMEOUT,
				notConfiguredStatusMessage: GITHUB_OAUTH_ERROR_CODES.NOT_CONFIGURED,
			})

			if (!proxyEnvelope.ok) {
				const networkDiagnostic = await resolveGithubNetworkDiagnostic()

				if (isIntroProxyTransportError(proxyEnvelope)) {
					console.error('[auth/github] user info network error', {
						transport: 'proxy',
						upstreamStatus: proxyEnvelope.status,
						errorMessage: proxyEnvelope.error,
						proxyRequestId: proxyEnvelope.requestId,
						networkDiagnostic,
					})

					throw createError({
						statusCode: 503,
						statusMessage: GITHUB_OAUTH_ERROR_CODES.NETWORK_ERROR,
					})
				}

				console.error('[auth/github] user info provider error', {
					transport: 'proxy',
					upstreamStatus: proxyEnvelope.status,
					upstreamData: resolveIntroProxyBodyText(proxyEnvelope),
					errorMessage: proxyEnvelope.error,
					proxyRequestId: proxyEnvelope.requestId,
					networkDiagnostic,
				})

				throw createError({
					statusCode: 502,
					statusMessage: GITHUB_OAUTH_ERROR_CODES.PROVIDER_ERROR,
				})
			}

			githubUserResult = {
				data: resolveIntroProxyJsonBody<GithubUserResponse>(proxyEnvelope),
				requestMeta: buildProxyRequestMeta(
					proxyEnvelope.durationMs,
					proxyEnvelope.requestId,
				),
			}
		} else {
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
		}
	} catch (error) {
		const statusMessage = resolveFetchErrorStatusMessage(error)

		if (
			statusMessage === GITHUB_OAUTH_ERROR_CODES.NOT_CONFIGURED ||
			statusMessage === GITHUB_OAUTH_ERROR_CODES.NETWORK_ERROR ||
			statusMessage === GITHUB_OAUTH_ERROR_CODES.PROVIDER_ERROR
		) {
			throw error
		}

		const errorCode = getErrorCode(error)
		const errorName = getErrorName(error)
		const errorMessage = getErrorMessage(error)
		const upstreamStatus = resolveFetchErrorStatus(error)
		const upstreamData = resolveFetchErrorData(error)
		const networkDiagnostic = await resolveGithubNetworkDiagnostic()

		if (isRetryableGithubNetworkError(error)) {
			console.error('[auth/github] user info network error', {
				transport: useProxy ? 'proxy' : 'direct',
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
			transport: useProxy ? 'proxy' : 'direct',
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

	if (
		typeof githubUser.id !== 'number' ||
		!githubUser.login ||
		!githubUser.avatar_url ||
		!githubUser.html_url
	) {
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

export const fetchGithubEmails = async (
	accessToken: string,
): Promise<GithubEmailResponse[]> => {
	try {
		const result = await fetchWithRetry<GithubEmailResponse[]>(
			'https://api.github.com/user/emails',
			{
				headers: {
					authorization: `Bearer ${accessToken}`,
					accept: 'application/vnd.github+json',
					'user-agent': 'AurLemon-Intro',
				},
			},
		)

		return Array.isArray(result.data) ? result.data : []
	} catch (error) {
		console.warn('GITHUB_EMAIL_FETCH_FAILED', {
			status: resolveFetchErrorStatus(error),
		})
		return []
	}
}
