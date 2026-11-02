import { OAuthProvider } from '~/generated/prisma/client'
import { createOAuthProgressHandler } from '~/server/utils/oauth-flow'

export default createOAuthProgressHandler(OAuthProvider.LINUX_DO)
