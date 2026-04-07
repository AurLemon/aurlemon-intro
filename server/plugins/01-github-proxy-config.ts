import { getGithubProxyLogMeta } from '~/server/utils/github-proxy'

declare global {
	var __githubProxyConfigLogged__: boolean | undefined
}

export default defineNitroPlugin(() => {
	if (globalThis.__githubProxyConfigLogged__) {
		return
	}

	globalThis.__githubProxyConfigLogged__ = true

	const { githubProxyEnabled, githubProxyConfigured } = getGithubProxyLogMeta()
	const proxyState = githubProxyEnabled && githubProxyConfigured ? 'on' : 'off'

	console.info(`[network] github proxy=${proxyState}`)
})
