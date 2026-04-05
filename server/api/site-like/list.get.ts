import { listSiteLikes } from '~/server/services/site-like.service'

export default defineEventHandler(async (event) => {
	const query = getQuery(event)
	const rawLimit = Number(query.limit)
	const limit = Number.isFinite(rawLimit) ? rawLimit : undefined

	return listSiteLikes(limit)
})
