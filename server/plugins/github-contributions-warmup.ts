import { startGithubContributionAutoRefresh } from '~/server/utils/github-contributions'

export default defineNitroPlugin(() => {
	if (import.meta.prerender) {
		return
	}
	startGithubContributionAutoRefresh()
})
