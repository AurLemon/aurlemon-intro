import { confirmAccountMerge } from '~/server/services/account.service'
import { requireUserSession } from '~/server/utils/user-auth'

export default defineEventHandler(async (event) => {
	const currentUser = await requireUserSession(event)
	const body = await readBody<{ token?: unknown }>(event)
	return { user: await confirmAccountMerge(currentUser, body.token) }
})
