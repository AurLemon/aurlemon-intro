import { OAuthProvider } from '~/generated/prisma/client'
import { createOAuthCallbackHandler } from '~/server/utils/oauth-flow'

export default createOAuthCallbackHandler(OAuthProvider.GITHUB)
