import { deleteFriendLinkByAdmin } from '~/server/services/friend-link.service'
import { requireAdminSession } from '~/server/utils/social-auth'

export default defineEventHandler(async (event) => {
	const currentUser = await requireAdminSession(event)
	const friendLinkId = getRouterParam(event, 'id')

	if (!friendLinkId) {
		throw createError({
			statusCode: 404,
			statusMessage: 'FRIEND_LINK_NOT_FOUND',
		})
	}

	await deleteFriendLinkByAdmin(friendLinkId, currentUser)

	return {
		ok: true,
	}
})
