import { deleteFriendLinkByAdmin } from '~/server/services/friend-link.service'
import { requireAdminUser } from '~/server/utils/user-auth'

export default defineEventHandler(async (event) => {
	const currentUser = await requireAdminUser(event)
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
