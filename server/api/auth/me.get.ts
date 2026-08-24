import { getUserSession } from '~/server/utils/user-auth'

export default defineEventHandler(async (event) => {
	const user = await getUserSession(event)

	return {
		user,
	}
})
