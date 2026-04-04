import { createGithubOAuthUrl } from '~/server/utils/social-auth'

export default defineEventHandler((event) => {
	return sendRedirect(event, createGithubOAuthUrl(event))
})
