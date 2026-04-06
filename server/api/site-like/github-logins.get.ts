import { listGithubLoginUsers } from '~/server/services/site-like.service'
import { getGithubSession } from '~/server/utils/social-auth'

export default defineEventHandler(async (event) => {
	const query = getQuery(event)
	const rawLimit = Number(query.limit)
	const limit = Number.isFinite(rawLimit) ? rawLimit : undefined
	const currentUser = await getGithubSession(event)

	return listGithubLoginUsers(currentUser, limit)
})
