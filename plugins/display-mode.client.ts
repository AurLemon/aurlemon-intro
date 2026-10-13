import {
	COMPACT_VIEWPORT_QUERY,
	HOVER_POINTER_QUERY,
	useDisplayModeState,
} from '~/composables/useDisplayMode'

export default defineNuxtPlugin((nuxtApp) => {
	const state = useDisplayModeState()
	const compact = window.matchMedia(COMPACT_VIEWPORT_QUERY)
	const hover = window.matchMedia(HOVER_POINTER_QUERY)
	const sync = () => {
		state.value = { compact: compact.matches, hover: hover.matches }
	}
	// 首次 hydration 沿用 SSR 状态；CSS 在此之前已处理窄屏静态样式。
	nuxtApp.hook('app:mounted', sync)
	compact.addEventListener('change', sync)
	hover.addEventListener('change', sync)
	if (import.meta.hot) {
		import.meta.hot.dispose(() => {
			compact.removeEventListener('change', sync)
			hover.removeEventListener('change', sync)
		})
	}
})
