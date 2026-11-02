import { getOAuthProgress } from '~/server/utils/oauth-progress'

const UUID_PATTERN =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export default defineEventHandler((event) => {
	setResponseHeader(event, 'cache-control', 'no-store, private')
	const flowId = getQuery(event).flow
	if (typeof flowId !== 'string' || !UUID_PATTERN.test(flowId)) {
		throw createError({ statusCode: 400, statusMessage: 'INVALID_OAUTH_STATE' })
	}
	return getOAuthProgress(flowId)
})
