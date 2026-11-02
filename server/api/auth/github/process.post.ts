import { OAuthIntent, OAuthProvider } from '~/generated/prisma/client'
import { getRequestHeader, getRequestURL } from 'h3'
import { completeOAuth } from '~/server/utils/user-auth'
import {
	beginOAuthProgress,
	completeOAuthProgress,
	failOAuthProgress,
	finishOAuthProgress,
	getOAuthProgress,
	getOAuthProgressRedirectPath,
	updateOAuthProgress,
} from '~/server/utils/oauth-progress'

const UUID_PATTERN =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const withResult = (
	redirectPath: string,
	key: 'authError' | 'accountMerge' | 'authSuccess' | 'authProvider',
	value: string,
): string => {
	const url = new URL(redirectPath, 'http://localhost')
	url.searchParams.set(key, value)
	return `${url.pathname}${url.search}${url.hash}`
}

const getErrorCode = (error: unknown): string => {
	if (!error || typeof error !== 'object') return 'GITHUB_OAUTH_CALLBACK_FAILED'
	const value = error as {
		statusMessage?: string
		data?: { statusMessage?: string }
	}
	return (
		value.data?.statusMessage ??
		value.statusMessage ??
		'GITHUB_OAUTH_CALLBACK_FAILED'
	)
}

export default defineEventHandler(async (event) => {
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
		throw createError({ statusCode: 400, statusMessage: 'INVALID_OAUTH_STATE' })
	}

	const flow = beginOAuthProgress(flowId)
	if (!flow) {
		throw createError({ statusCode: 401, statusMessage: 'INVALID_OAUTH_STATE' })
	}
	if (!flow.shouldStart) {
		return { redirectPath: getOAuthProgressRedirectPath(flowId) }
	}

	const traceId = flowId
	const startedAt = performance.now()
	let redirectPath: string
	console.info('GITHUB_OAUTH_CALLBACK_STARTED', { traceId })
	try {
		const result = await completeOAuth(event, OAuthProvider.GITHUB, traceId, {
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
					'github',
				)
		updateOAuthProgress(traceId, { key: 'redirecting' })
		completeOAuthProgress(traceId)
		finishOAuthProgress(traceId, redirectPath)
		return { redirectPath }
	} catch (error) {
		const code = getErrorCode(error)
		console.error('GITHUB_OAUTH_CALLBACK_FAILED', { traceId, errorCode: code })
		updateOAuthProgress(traceId, { key: 'failed' })
		failOAuthProgress(traceId, code)
		redirectPath = withResult(`${flow.localePrefix}/`, 'authError', code)
		finishOAuthProgress(traceId, redirectPath)
		return { redirectPath }
	} finally {
		console.info('GITHUB_OAUTH_CALLBACK_COMPLETED', {
			traceId,
			outcome: getOAuthProgress(traceId).status,
			durationMs: Math.round(performance.now() - startedAt),
		})
	}
})
