import { normalizeOwnerUsername } from '~/server/services/friend-link-owner.service'
import { updateFriendLinkByAdmin } from '~/server/services/friend-link.service'
import { requireAdminUser } from '~/server/utils/user-auth'
import {
	ensureNonEmptyString,
	ensureOptionalImageBase64,
	ensureValidUrl,
} from '~/server/utils/social-validators'

export default defineEventHandler(async (event) => {
	const currentUser = await requireAdminUser(event)
	const friendLinkId = getRouterParam(event, 'id')
	const body = await readBody(event)

	if (!friendLinkId) {
		throw createError({
			statusCode: 404,
			statusMessage: 'FRIEND_LINK_NOT_FOUND',
		})
	}

	if (body?.iconRounded !== undefined && typeof body.iconRounded !== 'boolean')
		throw createError({
			statusCode: 400,
			statusMessage: 'INVALID_FRIEND_LINK_ICON_ROUNDED',
		})

	await updateFriendLinkByAdmin(friendLinkId, currentUser, {
		iconRounded: body?.iconRounded,
		name: ensureNonEmptyString(body?.name, 'INVALID_FRIEND_LINK_NAME', 120),
		url: ensureValidUrl(body?.url, 'INVALID_FRIEND_LINK_URL'),
		desc: ensureNonEmptyString(body?.desc, 'INVALID_FRIEND_LINK_DESC', 300),
		imageBase64: await ensureOptionalImageBase64(body?.imageBase64),
		ownerGithubLogin:
			body?.ownerGithubLogin === undefined
				? undefined
				: normalizeOwnerUsername(body.ownerGithubLogin, 'GITHUB'),
		ownerLinuxDoUsername:
			body?.ownerLinuxDoUsername === undefined
				? undefined
				: normalizeOwnerUsername(body.ownerLinuxDoUsername, 'LINUX_DO'),
	})

	return {
		ok: true,
	}
})
