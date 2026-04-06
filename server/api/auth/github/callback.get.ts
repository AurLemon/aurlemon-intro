import {
	consumeGithubOAuthRedirect,
	consumeGithubOAuthState,
	createGithubSession,
	exchangeGithubCode,
	fetchGithubUser,
	GITHUB_OAUTH_ERROR_CODES,
} from '~/server/utils/social-auth'
import { getGithubProxyLogMeta } from '~/server/utils/github-proxy'

const OAUTH_STATE_ERROR_CODE = 'INVALID_GITHUB_OAUTH_STATE'

const OAUTH_CALLBACK_ERROR_CODES = new Set<string>([
	OAUTH_STATE_ERROR_CODE,
	GITHUB_OAUTH_ERROR_CODES.NOT_CONFIGURED,
	GITHUB_OAUTH_ERROR_CODES.NETWORK_ERROR,
	GITHUB_OAUTH_ERROR_CODES.PROVIDER_ERROR,
	GITHUB_OAUTH_ERROR_CODES.TOKEN_EXCHANGE_FAILED,
	GITHUB_OAUTH_ERROR_CODES.USER_PAYLOAD_INVALID,
	GITHUB_OAUTH_ERROR_CODES.CALLBACK_FAILED,
])

const resolveStatusMessage = (error: unknown): string | undefined => {
	if (!error || typeof error !== 'object') {
		return undefined
	}

	const maybeError = error as {
		statusMessage?: string
		data?: {
			statusMessage?: string
		}
	}

	return maybeError.data?.statusMessage ?? maybeError.statusMessage
}

const resolveStatusCode = (error: unknown): number | undefined => {
	if (!error || typeof error !== 'object') {
		return undefined
	}

	const maybeError = error as {
		statusCode?: number
		status?: number
		data?: {
			statusCode?: number
		}
	}

	return (
		maybeError.data?.statusCode ?? maybeError.statusCode ?? maybeError.status
	)
}

const resolveOauthErrorCode = (error: unknown): string => {
	const statusMessage = resolveStatusMessage(error)

	if (statusMessage && OAUTH_CALLBACK_ERROR_CODES.has(statusMessage)) {
		return statusMessage
	}

	return GITHUB_OAUTH_ERROR_CODES.CALLBACK_FAILED
}

const withAuthErrorQuery = (
	redirectPath: string,
	errorCode: string,
): string => {
	const safePath = redirectPath.startsWith('/') ? redirectPath : '/'
	const redirectUrl = new URL(safePath, 'http://localhost')
	redirectUrl.searchParams.set('authError', errorCode)
	return `${redirectUrl.pathname}${redirectUrl.search}${redirectUrl.hash}`
}

export default defineEventHandler(async (event) => {
	const redirectPath = consumeGithubOAuthRedirect(event)
	const githubProxyLogMeta = getGithubProxyLogMeta()
	const query = getQuery(event)
	const code = typeof query.code === 'string' ? query.code : ''
	const state = typeof query.state === 'string' ? query.state : ''
	const expectedState = consumeGithubOAuthState(event)

	if (!code || !state || !expectedState || state !== expectedState) {
		return sendRedirect(
			event,
			withAuthErrorQuery(redirectPath, OAUTH_STATE_ERROR_CODE),
		)
	}

	const callbackStartedAt = Date.now()

	try {
		const tokenExchange = await exchangeGithubCode(code)
		const githubUserFetch = await fetchGithubUser(tokenExchange.accessToken)
		const sessionUser = await createGithubSession(event, githubUserFetch.user)
		const tokenRetryCount = tokenExchange.requestMeta.retryCount
		const userRetryCount = githubUserFetch.requestMeta.retryCount
		const totalRetryCount = tokenRetryCount + userRetryCount

		console.info('[auth/github/callback] GitHub OAuth callback succeeded', {
			githubLogin: sessionUser.githubLogin,
			redirectPath,
			...githubProxyLogMeta,
			tokenTransport: tokenExchange.requestMeta.transport,
			userTransport: githubUserFetch.requestMeta.transport,
			tokenProxyRequestId: tokenExchange.requestMeta.proxyRequestId ?? null,
			userProxyRequestId: githubUserFetch.requestMeta.proxyRequestId ?? null,
			retried: totalRetryCount > 0,
			tokenRetryCount,
			userRetryCount,
			tokenDurationMs: tokenExchange.requestMeta.durationMs,
			userDurationMs: githubUserFetch.requestMeta.durationMs,
			durationMs: Date.now() - callbackStartedAt,
		})

		return sendRedirect(event, redirectPath)
	} catch (error) {
		const errorCode = resolveOauthErrorCode(error)
		const statusCode = resolveStatusCode(error)

		console.error('[auth/github/callback] GitHub OAuth callback failed', {
			statusCode,
			errorCode,
			redirectPath,
			...githubProxyLogMeta,
			durationMs: Date.now() - callbackStartedAt,
		})

		return sendRedirect(event, withAuthErrorQuery(redirectPath, errorCode))
	}
})
