import { getGithubSession } from '~/server/utils/social-auth'

export default defineEventHandler(async (event) => {
	const user = await getGithubSession(event)

	return {
		user,
	}
})
