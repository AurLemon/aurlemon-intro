import { createSiteLike } from '~/server/services/site-like.service'
import { ensureNonEmptyString } from '~/server/utils/social-validators'

export default defineEventHandler(async (event) => {
	const body = await readBody(event)
	const fingerprint = ensureNonEmptyString(
		body?.fingerprint,
		'INVALID_FINGERPRINT',
		200,
	)
	const ip =
		getRequestIP(event, { xForwardedFor: true }) ??
		getHeader(event, 'x-real-ip') ??
		'0.0.0.0'

	return createSiteLike(fingerprint, ip)
})
