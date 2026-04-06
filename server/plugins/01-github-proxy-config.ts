import { getGithubProxyLogMeta } from '~/server/utils/github-proxy'

declare global {
	var __githubProxyConfigLogged__: boolean | undefined
}

export default defineNitroPlugin(() => {
	if (globalThis.__githubProxyConfigLogged__) {
		return
	}

	globalThis.__githubProxyConfigLogged__ = true

	console.info('[network] github proxy config', getGithubProxyLogMeta())
})
