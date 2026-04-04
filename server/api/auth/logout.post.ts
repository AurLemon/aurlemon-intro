import { clearGithubSession } from '~/server/utils/social-auth'

export default defineEventHandler(async (event) => {
	await clearGithubSession(event)

	return {
		ok: true,
	}
})
