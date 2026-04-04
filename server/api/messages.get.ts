import { listMessageBoard } from '~/server/services/message-board.service'
import { getGithubSession } from '~/server/utils/social-auth'

export default defineEventHandler(async (event) => {
	const currentUser = await getGithubSession(event)

	return {
		items: await listMessageBoard(currentUser),
		currentUser,
	}
})
