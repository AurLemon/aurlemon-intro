import { OAuthProvider } from '~/generated/prisma/client'
import { startOAuth } from '~/server/utils/user-auth'

export default defineEventHandler(async (event) => {
	return sendRedirect(event, await startOAuth(event, OAuthProvider.GITHUB))
})
