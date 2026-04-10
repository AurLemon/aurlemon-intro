// plugins/baidu-stat

declare global {
	interface Window {
		_hmt: any[]
	}
}

export default defineNuxtPlugin(() => {
	if (import.meta.dev) {
		return
	}

	const baiduStatKey = useRuntimeConfig().public.baiduStatKey

	if (baiduStatKey) {
		window._hmt = window._hmt || []
		const script = document.createElement('script')
		script.src = `https://hm.baidu.com/hm.js?${baiduStatKey}`
		script.async = true
		const firstScript = document.getElementsByTagName('script')[0]
		if (firstScript?.parentNode) {
			firstScript.parentNode.insertBefore(script, firstScript)
		} else {
			document.head.appendChild(script)
		}
	}
})
