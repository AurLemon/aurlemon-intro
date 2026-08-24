import { listLoginUsers } from '~/server/services/site-like.service'
import { getUserSession } from '~/server/utils/user-auth'

const toPositiveInt = (value: unknown, fallback: number) => {
	const normalizedValue = Array.isArray(value) ? value[0] : value
	const parsed = Number(normalizedValue)
	if (!Number.isFinite(parsed)) return fallback
	const normalized = Math.floor(parsed)
	return normalized > 0 ? normalized : fallback
}

export default defineEventHandler(async (event) => {
	const query = getQuery(event)
	return listLoginUsers(await getUserSession(event), {
		page: toPositiveInt(query.page, 1),
		pageSize: toPositiveInt(query.pageSize ?? query.limit, 6),
	})
})
