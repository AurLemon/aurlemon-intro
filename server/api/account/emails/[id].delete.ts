import { deleteAccountEmail } from '~/server/services/account.service'
import { requireUserSession } from '~/server/utils/user-auth'

export default defineEventHandler(async (event) => {
	const currentUser = await requireUserSession(event)
	const emailId = getRouterParam(event, 'id')
	if (!emailId) {
		throw createError({ statusCode: 404, statusMessage: 'EMAIL_NOT_FOUND' })
	}
	return { removed: await deleteAccountEmail(currentUser, emailId) }
})
