import { requireAdminUser } from '~/server/utils/user-auth'
import {
	requestFriendLinkCoverRefresh,
	processFriendLinkCovers,
} from '~/server/services/friend-link-cover.service'
export default defineEventHandler(async (event) => {
	await requireAdminUser(event)
	const body = await readBody<{ id?: unknown }>(event)
	if (
		body?.id !== undefined &&
		(typeof body.id !== 'string' || !body.id || body.id.length > 128)
	) {
		throw createError({
			statusCode: 400,
			statusMessage: 'FRIEND_LINK_NOT_FOUND',
		})
	}
	await requestFriendLinkCoverRefresh(body?.id as string | undefined)
	event.waitUntil(
		processFriendLinkCovers().catch((error) => {
			console.error('FRIEND_LINK_COVER_REFRESH_FAILED', error)
		}),
	)
	setResponseStatus(event, 202)
	return { ok: true }
})
