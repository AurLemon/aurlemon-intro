import { listActiveFriendLinks } from '~/server/services/friend-link.service'
import { getGithubSession } from '~/server/utils/social-auth'

export default defineEventHandler(async (event) => {
	const [currentUser, items] = await Promise.all([
		getGithubSession(event),
		listActiveFriendLinks(),
	])

	return {
		items,
		currentUser,
	}
})
