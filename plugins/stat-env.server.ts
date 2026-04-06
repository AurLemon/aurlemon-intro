export default defineNuxtPlugin(() => {
	const runtimeConfig = useRuntimeConfig()

	// 兼容旧环境变量名，避免把统计配置绑死在构建阶段。
	runtimeConfig.public.baiduStatKey ||= process.env.BAIDU_STAT_KEY ?? ''
	runtimeConfig.public.msClarityId ||= process.env.MS_CLARITY_ID ?? ''
})
