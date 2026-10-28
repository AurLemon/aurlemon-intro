import { requireAdminUser } from '~/server/utils/user-auth'
import { saveFriendLinkCoverSettings } from '~/server/services/friend-link-cover.service'
import type { FriendLinkCoverSettings } from '~/shared/types/friend-link-cover'
export default defineEventHandler(async (event) => {
	await requireAdminUser(event)
	const body = await readBody<{ intervalDays?: unknown }>(event)
	if (![0, 7, 30, 90].includes(body?.intervalDays as number)) {
		throw createError({
			statusCode: 400,
			statusMessage: 'INVALID_FRIEND_LINK_COVER_INTERVAL',
		})
	}
	await saveFriendLinkCoverSettings({
		intervalDays: body.intervalDays as FriendLinkCoverSettings['intervalDays'],
	})
	return { ok: true }
})
