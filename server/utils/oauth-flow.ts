import { randomBytes, randomUUID } from 'node:crypto'
import {
	appendResponseHeader,
	getRequestHeader,
	getRequestURL,
	getResponseHeader,
} from 'h3'
import { OAuthIntent, OAuthProvider } from '~/generated/prisma/client'
import prisma from '~/lib/prisma'
import { completeOAuth, hashSecret } from '~/server/utils/user-auth'
import {
	beginOAuthProgress,
	completeOAuthProgress,
	failOAuthProgress,
	finishOAuthProgress,
	getOAuthProgress,
	getOAuthFlowCookieName,
	getOAuthProgressResult,
	verifyOAuthProgressBrowser,
	updateOAuthProgress,
	startOAuthProgress,
} from '~/server/utils/oauth-progress'

const UUID_PATTERN =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const providerPath = (provider: OAuthProvider): string =>
	provider === OAuthProvider.GITHUB ? 'github' : 'linuxdo'
const providerLogPrefix = (provider: OAuthProvider): string =>
	provider === OAuthProvider.GITHUB ? 'GITHUB' : 'LINUX_DO'
const callbackErrorCode = (provider: OAuthProvider): string =>
	`${providerLogPrefix(provider)}_OAUTH_CALLBACK_FAILED`

const getLocalePrefix = (redirectPath: string | undefined): string => {
	const match = redirectPath?.match(/^\/(en-US|ja-JP)(?:\/|$)/)
	return match ? `/${match[1]}` : ''
}

export const createOAuthCallbackHandler = (provider: OAuthProvider) =>
	defineEventHandler(async (event) => {
		const query = getQuery(event)
		const code = typeof query.code === 'string' ? query.code : ''
		const state = typeof query.state === 'string' ? query.state : ''
		const safeCode = code.length <= 2048 ? code : ''
		const safeState = state.length <= 2048 ? state : ''
		const traceId = randomUUID()
		let localePrefix = ''

		if (safeState) {
			const transaction = await prisma.oAuthTransaction
				.findUnique({ where: { stateHash: hashSecret(safeState) } })
				.catch(() => null)
			localePrefix = getLocalePrefix(transaction?.redirectPath)
		}

		const browserSecret = randomBytes(32).toString('base64url')
		startOAuthProgress(
			traceId,
			safeCode,
			safeState,
			localePrefix,
			hashSecret(browserSecret),
			provider,
		)
		setCookie(event, getOAuthFlowCookieName(traceId), browserSecret, {
			httpOnly: true,
			sameSite: 'lax',
			secure: process.env.NODE_ENV === 'production',
			path: '/api/auth',
			maxAge: 5 * 60,
		})
		setResponseHeader(event, 'cache-control', 'no-store, private')
		setResponseHeader(event, 'referrer-policy', 'no-referrer')
		return sendRedirect(
			event,
			`${localePrefix}/api/oauth/callback?provider=${providerPath(provider)}&flow=${traceId}`,
		)
	})

const withResult = (
	redirectPath: string,
	key: 'authError' | 'accountMerge' | 'authSuccess' | 'authProvider',
	value: string,
): string => {
	const url = new URL(redirectPath, 'http://localhost')
	url.searchParams.set(key, value)
	return `${url.pathname}${url.search}${url.hash}`
}

const getErrorCode = (error: unknown, provider: OAuthProvider): string => {
	if (!error || typeof error !== 'object') return callbackErrorCode(provider)
	const value = error as {
		statusMessage?: string
		data?: { statusMessage?: string }
	}
	return (
		value.data?.statusMessage ??
		value.statusMessage ??
		callbackErrorCode(provider)
	)
}

export const createOAuthProcessHandler = (provider: OAuthProvider) =>
	defineEventHandler(async (event) => {
		setResponseHeader(event, 'cache-control', 'no-store, private')
		const origin = getRequestHeader(event, 'origin')
		if (origin) {
			let originHost: string
			try {
				originHost = new URL(origin).host
			} catch {
				throw createError({
					statusCode: 403,
					statusMessage: 'INVALID_OAUTH_STATE',
				})
			}
			if (originHost !== getRequestURL(event).host) {
				throw createError({
					statusCode: 403,
					statusMessage: 'INVALID_OAUTH_STATE',
				})
			}
		}
		const body = await readBody<{ flowId?: unknown }>(event)
		const flowId = typeof body?.flowId === 'string' ? body.flowId : ''
		if (!UUID_PATTERN.test(flowId)) {
			throw createError({
				statusCode: 400,
				statusMessage: 'INVALID_OAUTH_STATE',
			})
		}

		const browserSecret = getCookie(event, getOAuthFlowCookieName(flowId))
		if (
			!browserSecret ||
			!verifyOAuthProgressBrowser(flowId, hashSecret(browserSecret), provider)
		) {
			throw createError({
				statusCode: 401,
				statusMessage: 'INVALID_OAUTH_STATE',
			})
		}
		const flow = beginOAuthProgress(flowId)
		if (!flow) {
			throw createError({
				statusCode: 401,
				statusMessage: 'INVALID_OAUTH_STATE',
			})
		}
		if (!flow.shouldStart) {
			const result = getOAuthProgressResult(flowId)
			for (const cookie of result.sessionCookies ?? []) {
				appendResponseHeader(event, 'set-cookie', cookie)
			}
			return { redirectPath: result.redirectPath }
		}

		const traceId = flowId
		const startedAt = performance.now()
		let redirectPath: string
		console.info(`${providerLogPrefix(provider)}_OAUTH_CALLBACK_STARTED`, {
			traceId,
		})
		try {
			const result = await completeOAuth(event, provider, traceId, {
				code: flow.code,
				state: flow.state,
				onProgress: (update) => updateOAuthProgress(traceId, update),
			})
			redirectPath = result.mergeToken
				? withResult(result.redirectPath, 'accountMerge', result.mergeToken)
				: withResult(
						withResult(
							result.redirectPath,
							'authSuccess',
							result.intent === OAuthIntent.CONNECT ? 'connect' : 'sign-in',
						),
						'authProvider',
						providerPath(provider),
					)
			updateOAuthProgress(traceId, { key: 'redirecting' })
			completeOAuthProgress(traceId)
			const cookieHeader = getResponseHeader(event, 'set-cookie')
			const sessionCookies = Array.isArray(cookieHeader)
				? cookieHeader.map(String)
				: cookieHeader
					? [String(cookieHeader)]
					: []
			finishOAuthProgress(traceId, redirectPath, sessionCookies)
			return { redirectPath }
		} catch (error) {
			const code = getErrorCode(error, provider)
			console.error(callbackErrorCode(provider), { traceId, errorCode: code })
			updateOAuthProgress(traceId, { key: 'failed' })
			failOAuthProgress(traceId, code)
			redirectPath = withResult(`${flow.localePrefix}/`, 'authError', code)
			finishOAuthProgress(traceId, redirectPath)
			return { redirectPath }
		} finally {
			console.info(`${providerLogPrefix(provider)}_OAUTH_CALLBACK_COMPLETED`, {
				traceId,
				outcome: getOAuthProgress(traceId).status,
				durationMs: Math.round(performance.now() - startedAt),
			})
		}
	})

export const createOAuthProgressHandler = (provider: OAuthProvider) =>
	defineEventHandler((event) => {
		setResponseHeader(event, 'cache-control', 'no-store, private')
		const flowId = getQuery(event).flow
		if (typeof flowId !== 'string' || !UUID_PATTERN.test(flowId)) {
			throw createError({
				statusCode: 400,
				statusMessage: 'INVALID_OAUTH_STATE',
			})
		}
		const browserSecret = getCookie(event, getOAuthFlowCookieName(flowId))
		if (
			!browserSecret ||
			!verifyOAuthProgressBrowser(flowId, hashSecret(browserSecret), provider)
		) {
			throw createError({
				statusCode: 401,
				statusMessage: 'INVALID_OAUTH_STATE',
			})
		}
		return getOAuthProgress(flowId)
	})
