import {
	listMessageBoard,
	updateMessageComment,
} from '~/server/services/message-board.service'
import { requireGithubSession } from '~/server/utils/social-auth'
import { ensureNonEmptyString } from '~/server/utils/social-validators'

export default defineEventHandler(async (event) => {
	const currentUser = await requireGithubSession(event)
	const commentId = getRouterParam(event, 'id')
	const body = await readBody(event)

	if (!commentId) {
		throw createError({
			statusCode: 400,
			statusMessage: 'COMMENT_NOT_FOUND',
		})
	}

	const content = ensureNonEmptyString(
		body?.content,
		'INVALID_COMMENT_CONTENT',
		1_000,
	)

	await updateMessageComment(commentId, content, currentUser)

	return {
		items: await listMessageBoard(currentUser),
		currentUser,
	}
})
