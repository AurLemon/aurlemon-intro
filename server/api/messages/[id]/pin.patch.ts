import {
	listMessageBoard,
	setMessageCommentPinned,
} from '~/server/services/message-board.service'
import { parseMessageBoardPagination } from '~/server/utils/message-board-pagination'
import { requireAdminSession } from '~/server/utils/social-auth'

export default defineEventHandler(async (event) => {
	const currentUser = await requireAdminSession(event)
	const paginationQuery = parseMessageBoardPagination(getQuery(event))
	const commentId = getRouterParam(event, 'id')
	const body = await readBody(event)
	const pinned = typeof body?.pinned === 'boolean' ? body.pinned : null

	if (!commentId) {
		throw createError({
			statusCode: 400,
			statusMessage: 'COMMENT_NOT_FOUND',
		})
	}

	if (pinned === null) {
		throw createError({
			statusCode: 400,
			statusMessage: 'INVALID_COMMENT_PINNED_STATE',
		})
	}

	await setMessageCommentPinned(commentId, pinned)
	const board = await listMessageBoard(currentUser, paginationQuery)

	return {
		items: board.items,
		pagination: board.pagination,
		currentUser,
	}
})
