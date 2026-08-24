import { updateAccountProfile } from '~/server/services/account.service'
import { requireUserSession } from '~/server/utils/user-auth'

export default defineEventHandler(async (event) => {
	const currentUser = await requireUserSession(event)
	const body = await readBody<Record<string, unknown>>(event)
	return {
		user: await updateAccountProfile(currentUser, {
			username: body.username,
			displayName: body.displayName,
			preferredAvatarIdentityId: body.preferredAvatarIdentityId,
			preferredLocale: body.preferredLocale,
		}),
	}
})
