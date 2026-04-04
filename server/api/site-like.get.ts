import { getSiteLikeSummary } from '~/server/services/site-like.service'

export default defineEventHandler(async (event) => {
	const fingerprint = getQuery(event).fingerprint

	return getSiteLikeSummary(
		typeof fingerprint === 'string' ? fingerprint : undefined,
	)
})
