import { startBangumiAutoRefresh } from '~/server/utils/bangumi'

export default defineNitroPlugin(() => {
	if (import.meta.prerender) {
		return
	}

	startBangumiAutoRefresh()
})
