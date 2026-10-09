import { OAuthProvider } from '~/generated/prisma/client'
import { disconnectIdentity } from '~/server/services/account.service'
import { requireUserSession } from '~/server/utils/user-auth'

export default defineEventHandler(async (event) => {
	const currentUser = await requireUserSession(event)
	const rawProvider = getRouterParam(event, 'provider')?.toUpperCase()
	const provider = rawProvider === 'LINUXDO' ? 'LINUX_DO' : rawProvider
	if (
		provider !== OAuthProvider.GITHUB &&
		provider !== OAuthProvider.LINUX_DO
	) {
		throw createError({
			statusCode: 400,
			statusMessage: 'INVALID_OAUTH_PROVIDER',
		})
	}
	return { user: await disconnectIdentity(currentUser, provider) }
})
