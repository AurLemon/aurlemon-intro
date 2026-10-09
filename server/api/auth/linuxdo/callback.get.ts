import { OAuthIntent, OAuthProvider } from '~/generated/prisma/client'
import { completeOAuth } from '~/server/utils/user-auth'

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
		'linuxdo',
	)

const errorCode = (error: unknown): string => {
	if (!error || typeof error !== 'object')
		return 'LINUX_DO_OAUTH_CALLBACK_FAILED'
	const value = error as {
		statusMessage?: string
		data?: { statusMessage?: string }
	}
	return (
		value.data?.statusMessage ??
		value.statusMessage ??
		'LINUX_DO_OAUTH_CALLBACK_FAILED'
	)
}

export default defineEventHandler(async (event) => {
	try {
		const result = await completeOAuth(event, OAuthProvider.LINUX_DO)
		return sendRedirect(
			event,
			result.mergeToken
				? withResult(result.redirectPath, 'accountMerge', result.mergeToken)
				: withSuccess(result.redirectPath, result.intent),
		)
	} catch (error) {
		console.error('LINUX_DO_OAUTH_CALLBACK_FAILED', {
			errorCode: errorCode(error),
		})
		return sendRedirect(event, withResult('/', 'authError', errorCode(error)))
	}
})
