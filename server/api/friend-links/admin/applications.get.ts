import { listPendingFriendLinkApplications } from '~/server/services/friend-link.service'
import { requireAdminSession } from '~/server/utils/social-auth'

export default defineEventHandler(async (event) => {
	await requireAdminSession(event)

	return {
		items: await listPendingFriendLinkApplications(),
	}
})
