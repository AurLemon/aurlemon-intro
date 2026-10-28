import { submitFriendLinkApplication } from '~/server/services/friend-link.service'
import { requireUserSession } from '~/server/utils/user-auth'
import {
	ensureNonEmptyString,
	ensureOptionalImageBase64,
	ensureValidUrl,
} from '~/server/utils/social-validators'

export default defineEventHandler(async (event) => {
	const currentUser = await requireUserSession(event)
	const body = await readBody(event)
	if (
		body?.note != null &&
		(typeof body.note !== 'string' || body.note.trim().length > 2000)
	) {
		throw createError({
			statusCode: 400,
			statusMessage: 'INVALID_FRIEND_LINK_NOTE',
		})
	}

	await submitFriendLinkApplication(currentUser, {
		name: ensureNonEmptyString(body?.name, 'INVALID_FRIEND_LINK_NAME', 120),
		url: ensureValidUrl(body?.url, 'INVALID_FRIEND_LINK_URL'),
		desc: ensureNonEmptyString(body?.desc, 'INVALID_FRIEND_LINK_DESC', 300),
		imageBase64: ensureOptionalImageBase64(body?.imageBase64),
		note:
			typeof body?.note === 'string' && body.note.trim()
				? body.note.trim()
				: null,
	})

	return {
		ok: true,
	}
})
