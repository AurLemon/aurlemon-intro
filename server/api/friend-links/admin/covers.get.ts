import { requireAdminUser } from '~/server/utils/user-auth'
import { getFriendLinkCoverAdminState } from '~/server/services/friend-link-cover.service'
export default defineEventHandler(async (event) => {
	await requireAdminUser(event)
	setResponseHeader(event, 'Cache-Control', 'no-store')
	return getFriendLinkCoverAdminState()
})
