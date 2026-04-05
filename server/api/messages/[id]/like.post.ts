import {
	likeMessageComment,
	listMessageBoard,
} from '~/server/services/message-board.service'
import { parseMessageBoardPagination } from '~/server/utils/message-board-pagination'
import { requireGithubSession } from '~/server/utils/social-auth'

export default defineEventHandler(async (event) => {
	const currentUser = await requireGithubSession(event)
	const paginationQuery = parseMessageBoardPagination(getQuery(event))
	const commentId = getRouterParam(event, 'id')

	if (!commentId) {
		throw createError({
			statusCode: 400,
			statusMessage: 'COMMENT_NOT_FOUND',
		})
	}

	await likeMessageComment(commentId, currentUser)
	const board = await listMessageBoard(currentUser, paginationQuery)

	return {
		items: board.items,
		pagination: board.pagination,
		currentUser,
	}
})
