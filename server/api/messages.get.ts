import { listMessageBoard } from '~/server/services/message-board.service'
import { parseMessageBoardPagination } from '~/server/utils/message-board-pagination'
import { getGithubSession } from '~/server/utils/social-auth'

export default defineEventHandler(async (event) => {
	const currentUser = await getGithubSession(event)
	const paginationQuery = parseMessageBoardPagination(getQuery(event))
	const board = await listMessageBoard(currentUser, paginationQuery)

	return {
		items: board.items,
		pagination: board.pagination,
		currentUser,
	}
})
