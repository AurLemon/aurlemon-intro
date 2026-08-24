import { requestEmailVerification } from '~/server/services/account.service'
import { requireUserSession } from '~/server/utils/user-auth'

export default defineEventHandler(async (event) => {
	const currentUser = await requireUserSession(event)
	const body = await readBody<{ email?: unknown }>(event)
	return { email: await requestEmailVerification(currentUser, body.email) }
})
