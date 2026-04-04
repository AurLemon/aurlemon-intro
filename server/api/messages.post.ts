import {
	createMessageComment,
	listMessageBoard,
} from '~/server/services/message-board.service'
import { requireGithubSession } from '~/server/utils/social-auth'
import { ensureNonEmptyString } from '~/server/utils/social-validators'

export default defineEventHandler(async (event) => {
	const currentUser = await requireGithubSession(event)
	const body = await readBody(event)
	const content = ensureNonEmptyString(
		body?.content,
		'INVALID_COMMENT_CONTENT',
		1_000,
	)
	const parentId =
		typeof body?.parentId === 'string' && body.parentId.trim()
			? body.parentId.trim()
			: null

	await createMessageComment(currentUser, content, parentId)

	return {
		items: await listMessageBoard(currentUser),
		currentUser,
	}
})
