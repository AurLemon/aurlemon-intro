import { updateNotificationPreferences } from '~/server/services/account.service'
import { requireUserSession } from '~/server/utils/user-auth'

export default defineEventHandler(async (event) => {
	const currentUser = await requireUserSession(event)
	const body = await readBody<Record<string, unknown>>(event)
	return {
		notifications: await updateNotificationPreferences(currentUser, {
			replyEmailEnabled:
				typeof body.replyEmailEnabled === 'boolean'
					? body.replyEmailEnabled
					: undefined,
			adminCommentEmailEnabled:
				typeof body.adminCommentEmailEnabled === 'boolean'
					? body.adminCommentEmailEnabled
					: undefined,
			adminFriendLinkEmailEnabled:
				typeof body.adminFriendLinkEmailEnabled === 'boolean'
					? body.adminFriendLinkEmailEnabled
					: undefined,
		}),
	}
})
