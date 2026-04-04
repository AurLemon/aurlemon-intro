import { approveFriendLinkApplication } from '~/server/services/friend-link.service'
import { requireAdminSession } from '~/server/utils/social-auth'

export default defineEventHandler(async (event) => {
	const currentUser = await requireAdminSession(event)
	const applicationId = getRouterParam(event, 'id')

	if (!applicationId) {
		throw createError({
			statusCode: 400,
			statusMessage: 'FRIEND_LINK_APPLICATION_NOT_FOUND',
		})
	}

	await approveFriendLinkApplication(applicationId, currentUser)

	return {
		ok: true,
	}
})
