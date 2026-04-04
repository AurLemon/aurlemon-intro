import {
	consumeGithubOAuthRedirect,
	consumeGithubOAuthState,
	createGithubSession,
	exchangeGithubCode,
	fetchGithubUser,
} from '~/server/utils/social-auth'

export default defineEventHandler(async (event) => {
	const query = getQuery(event)
	const code = typeof query.code === 'string' ? query.code : ''
	const state = typeof query.state === 'string' ? query.state : ''
	const expectedState = consumeGithubOAuthState(event)

	if (!code || !state || !expectedState || state !== expectedState) {
		throw createError({
			statusCode: 400,
			statusMessage: 'INVALID_GITHUB_OAUTH_STATE',
		})
	}

	const accessToken = await exchangeGithubCode(code)
	const githubUser = await fetchGithubUser(accessToken)

	await createGithubSession(event, githubUser)

	return sendRedirect(event, consumeGithubOAuthRedirect(event))
})
