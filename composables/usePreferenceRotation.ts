/** 六秒是最小展示窗口；作品名可以延长窗口，后台时间不消耗阅读时间。 */
const MIN_DISPLAY_MS = 6000

export const usePreferenceRotation = (advance: () => void | Promise<void>) => {
	let timer: ReturnType<typeof setTimeout> | undefined
	let mounted = false
	let baseline = 0
	let readingDeadline = 0
	let pausedRemaining = MIN_DISPLAY_MS
	let advancing = false
	const schedule = () => {
		if (timer !== undefined) clearTimeout(timer)
		if (!mounted || document.hidden || advancing) return
		timer = setTimeout(
			async () => {
				advancing = true
				readingDeadline = 0
				try {
					await advance()
				} finally {
					advancing = false
					baseline = Date.now() + MIN_DISPLAY_MS
					pausedRemaining = Math.max(
						MIN_DISPLAY_MS,
						readingDeadline - Date.now(),
					)
					schedule()
				}
			},
			Math.max(0, Math.max(baseline, readingDeadline) - Date.now()),
		)
	}
	const deferFor = (duration: number) => {
		if (!Number.isFinite(duration) || duration < 0) return
		readingDeadline = Date.now() + duration
		if (document.hidden) pausedRemaining = Math.max(pausedRemaining, duration)
		schedule()
	}
	const syncVisibility = () => {
		if (document.hidden) {
			pausedRemaining = Math.max(
				0,
				Math.max(baseline, readingDeadline) - Date.now(),
			)
			if (timer !== undefined) clearTimeout(timer)
		} else {
			baseline = Date.now() + pausedRemaining
			readingDeadline = 0
			schedule()
		}
	}
	onMounted(() => {
		mounted = true
		baseline = Date.now() + MIN_DISPLAY_MS
		document.addEventListener('visibilitychange', syncVisibility)
		schedule()
	})
	onBeforeUnmount(() => {
		mounted = false
		if (timer !== undefined) clearTimeout(timer)
		document.removeEventListener('visibilitychange', syncVisibility)
	})
	return deferFor
}
