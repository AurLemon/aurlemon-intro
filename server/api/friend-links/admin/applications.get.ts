import { listPendingFriendLinkApplications } from '~/server/services/friend-link.service'
import { requireAdminUser } from '~/server/utils/user-auth'

export default defineEventHandler(async (event) => {
	await requireAdminUser(event)

	return {
		items: await listPendingFriendLinkApplications(),
	}
})
