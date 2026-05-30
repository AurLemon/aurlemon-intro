import { getIntroProxyLogMeta } from '~/server/utils/intro-proxy'

declare global {
	var __introProxyConfigLogged__: boolean | undefined
}

export default defineNitroPlugin(() => {
	if (globalThis.__introProxyConfigLogged__) {
		return
	}

	globalThis.__introProxyConfigLogged__ = true

	const { introProxyConfigured, githubProxyEnabled, bangumiProxyEnabled } =
		getIntroProxyLogMeta()
	const proxyState = introProxyConfigured ? 'configured' : 'missing-config'

	console.info(
		`[network] intro proxy=${proxyState} github=${githubProxyEnabled ? 'on' : 'off'} bangumi=${bangumiProxyEnabled ? 'on' : 'off'}`,
	)
})
