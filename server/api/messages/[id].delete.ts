import {
	deleteMessageComment,
	listMessageBoard,
} from '~/server/services/message-board.service'
import { requireGithubSession } from '~/server/utils/social-auth'

export default defineEventHandler(async (event) => {
	const currentUser = await requireGithubSession(event)
	const commentId = getRouterParam(event, 'id')

	if (!commentId) {
		throw createError({
			statusCode: 400,
			statusMessage: 'COMMENT_NOT_FOUND',
		})
	}

	await deleteMessageComment(commentId, currentUser)

	return {
		items: await listMessageBoard(currentUser),
		currentUser,
	}
})
