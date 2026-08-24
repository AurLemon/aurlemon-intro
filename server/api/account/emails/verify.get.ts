import { confirmEmailVerification } from '~/server/services/account.service'

export default defineEventHandler(async (event) => {
	const locale = getQuery(event).locale
	const prefix = locale === 'en-US' || locale === 'ja-JP' ? `/${locale}` : ''
	const token = getQuery(event).token
	if (typeof token !== 'string') {
		return sendRedirect(event, `${prefix}/?emailVerification=invalid`)
	}
	try {
		await confirmEmailVerification(token)
	} catch (error) {
		if (
			typeof error === 'object' &&
			error &&
			'statusMessage' in error &&
			error.statusMessage === 'EMAIL_VERIFICATION_INVALID'
		) {
			return sendRedirect(event, `${prefix}/?emailVerification=invalid`)
		}
		throw error
	}
	return sendRedirect(event, `${prefix}/?emailVerified=1`)
})
