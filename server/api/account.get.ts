import { getAccountDetails } from '~/server/services/account.service'
import { requireUserSession } from '~/server/utils/user-auth'

export default defineEventHandler(async (event) => ({
	account: await getAccountDetails(await requireUserSession(event)),
}))
