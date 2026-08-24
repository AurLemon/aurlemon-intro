import { rejectFriendLinkApplicationByAdmin } from '~/server/services/friend-link.service'
import { requireAdminUser } from '~/server/utils/user-auth'

export default defineEventHandler(async (event) => {
	const currentUser = await requireAdminUser(event)
	const applicationId = getRouterParam(event, 'id')

	if (!applicationId) {
		throw createError({
			statusCode: 404,
			statusMessage: 'FRIEND_LINK_APPLICATION_NOT_FOUND',
		})
	}

	await rejectFriendLinkApplicationByAdmin(applicationId, currentUser)

	return { ok: true }
})
