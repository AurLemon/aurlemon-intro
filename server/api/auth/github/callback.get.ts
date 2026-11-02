import { OAuthIntent, OAuthProvider } from '~/generated/prisma/client'
import { completeOAuth } from '~/server/utils/user-auth'
import { randomUUID } from 'node:crypto'

const withResult = (
	redirectPath: string,
	key: 'authError' | 'accountMerge' | 'authSuccess' | 'authProvider',
	value: string,
) => {
	const url = new URL(redirectPath, 'http://localhost')
	url.searchParams.set(key, value)
	return `${url.pathname}${url.search}${url.hash}`
}

const withSuccess = (redirectPath: string, intent: OAuthIntent): string =>
	withResult(
		withResult(
			redirectPath,
			'authSuccess',
			intent === OAuthIntent.CONNECT ? 'connect' : 'sign-in',
		),
		'authProvider',
		'github',
	)

const errorCode = (error: unknown): string => {
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
	const traceId = randomUUID()
	const startedAt = performance.now()
	let outcome = 'failed'
	console.info('GITHUB_OAUTH_CALLBACK_STARTED', { traceId })
	try {
		const result = await completeOAuth(event, OAuthProvider.GITHUB, traceId)
		outcome = result.mergeToken ? 'merge_required' : 'success'
		return sendRedirect(
			event,
			result.mergeToken
				? withResult(result.redirectPath, 'accountMerge', result.mergeToken)
				: withSuccess(result.redirectPath, result.intent),
		)
	} catch (error) {
		console.error('GITHUB_OAUTH_CALLBACK_FAILED', {
			traceId,
			errorCode: errorCode(error),
		})
		return sendRedirect(event, withResult('/', 'authError', errorCode(error)))
	} finally {
		console.info('GITHUB_OAUTH_CALLBACK_COMPLETED', {
			traceId,
			outcome,
			durationMs: Math.round(performance.now() - startedAt),
		})
	}
})
