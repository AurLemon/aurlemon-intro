import { updateFriendLinkByAdmin } from '~/server/services/friend-link.service'
import { requireAdminSession } from '~/server/utils/social-auth'
import {
	ensureNonEmptyString,
	ensureOptionalImageBase64,
	ensureValidUrl,
} from '~/server/utils/social-validators'

export default defineEventHandler(async (event) => {
	const currentUser = await requireAdminSession(event)
	const friendLinkId = getRouterParam(event, 'id')
	const body = await readBody(event)

	if (!friendLinkId) {
		throw createError({
			statusCode: 404,
			statusMessage: 'FRIEND_LINK_NOT_FOUND',
		})
	}

	await updateFriendLinkByAdmin(friendLinkId, currentUser, {
		name: ensureNonEmptyString(body?.name, 'INVALID_FRIEND_LINK_NAME', 120),
		url: ensureValidUrl(body?.url, 'INVALID_FRIEND_LINK_URL'),
		desc: ensureNonEmptyString(body?.desc, 'INVALID_FRIEND_LINK_DESC', 300),
		imageBase64: ensureOptionalImageBase64(body?.imageBase64),
	})

	return {
		ok: true,
	}
})
