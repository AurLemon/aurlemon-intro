import { listActiveFriendLinks } from '~/server/services/friend-link.service'
import { getUserSession } from '~/server/utils/user-auth'

export default defineEventHandler(async (event) => {
	const [currentUser, items] = await Promise.all([
		getUserSession(event),
		listActiveFriendLinks(),
	])

	return {
		items,
		currentUser,
	}
})
