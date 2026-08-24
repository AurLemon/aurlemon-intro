import { clearUserSession } from '~/server/utils/user-auth'

export default defineEventHandler(async (event) => {
	await clearUserSession(event)

	return {
		ok: true,
	}
})
