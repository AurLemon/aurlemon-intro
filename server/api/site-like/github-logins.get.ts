import { listGithubLoginUsers } from '~/server/services/site-like.service'
import { getGithubSession } from '~/server/utils/social-auth'

const toPositiveInt = (value: unknown, fallback: number) => {
	const normalizedValue = Array.isArray(value) ? value[0] : value
	const parsed = Number(normalizedValue)

	if (!Number.isFinite(parsed)) {
		return fallback
	}

	const normalized = Math.floor(parsed)
	return normalized > 0 ? normalized : fallback
}

export default defineEventHandler(async (event) => {
	const query = getQuery(event)
	const page = toPositiveInt(query.page, 1)
	const pageSize = toPositiveInt(query.pageSize ?? query.limit, 6)
	const currentUser = await getGithubSession(event)

	return listGithubLoginUsers(currentUser, {
		page,
		pageSize,
	})
})
