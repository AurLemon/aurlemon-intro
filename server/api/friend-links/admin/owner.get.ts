import { requireAdminUser } from '~/server/utils/user-auth'
import { lookupFriendLinkOwner } from '~/server/services/friend-link-owner.service'

export default defineEventHandler(async (event) => {
	await requireAdminUser(event)
	const query = getQuery(event)
	if (query.provider !== 'GITHUB' && query.provider !== 'LINUX_DO')
		throw createError({
			statusCode: 400,
			statusMessage: 'INVALID_FRIEND_LINK_OWNER',
		})
	return lookupFriendLinkOwner(query.provider, query.username)
})
