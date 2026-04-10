export default defineNuxtPlugin(() => {
	if (import.meta.dev) {
		return
	}

	const runtimeConfig = useRuntimeConfig()

	runtimeConfig.public.baiduStatKey ||= process.env.BAIDU_STAT_KEY ?? ''
	runtimeConfig.public.msClarityId ||= process.env.MS_CLARITY_ID ?? ''
})
