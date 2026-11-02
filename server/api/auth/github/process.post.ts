import { OAuthProvider } from '~/generated/prisma/client'
import { createOAuthProcessHandler } from '~/server/utils/oauth-flow'

export default createOAuthProcessHandler(OAuthProvider.GITHUB)
