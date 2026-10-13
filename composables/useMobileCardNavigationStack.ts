export interface MobileNavigationHint {
	id: string
	to: string
	labelKey: string
	pageKey: string
}

export const useMobileCardNavigationStack = (
	container: Ref<HTMLElement | null>,
	enabled: Ref<boolean>,
	definitions: readonly MobileNavigationHint[],
) => {
	const hints = ref<MobileNavigationHint[]>([])
	let scrolling = false
	const timers = new Map<string, ReturnType<typeof setTimeout>>()
	let settleTimer: ReturnType<typeof setTimeout> | undefined
	let observer: IntersectionObserver | undefined
	let mounted = false
	const remove = (id: string) => {
		const timer = timers.get(id)
		if (timer !== undefined) clearTimeout(timer)
		timers.delete(id)
		hints.value = hints.value.filter((hint) => hint.id !== id)
	}
	const clearHints = () => {
		for (const timer of timers.values()) clearTimeout(timer)
		timers.clear()
		hints.value = []
	}
	const enqueue = (id: string) => {
		const hint = definitions.find((entry) => entry.id === id)
		if (!hint || document.hidden) return
		remove(id)
		hints.value = [hint, ...hints.value]
		if (hints.value.length > 3) remove(hints.value[3]!.id)
		if (!scrolling)
			timers.set(
				id,
				setTimeout(() => remove(id), 4000),
			)
	}
	const onScroll = () => {
		if (!scrolling) {
			scrolling = true
			for (const timer of timers.values()) clearTimeout(timer)
			timers.clear()
		}
		if (settleTimer !== undefined) clearTimeout(settleTimer)
		// 停滚只启动静止倒计时；卡片进入与离开由 observer 立即处理。
		settleTimer = setTimeout(() => {
			settleTimer = undefined
			scrolling = false
			for (const hint of hints.value)
				timers.set(
					hint.id,
					setTimeout(() => remove(hint.id), 4000),
				)
		}, 180)
	}
	const clear = () => {
		observer?.disconnect()
		observer = undefined
		window.removeEventListener('scroll', onScroll)
		if (settleTimer !== undefined) clearTimeout(settleTimer)
		settleTimer = undefined
		scrolling = false
		clearHints()
	}
	const observe = () => {
		if (!mounted) return
		clear()
		if (!enabled.value || !container.value || document.hidden) return
		observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					const id = (entry.target as HTMLElement).dataset.navigationCard
					if (!id) continue
					if (entry.isIntersecting && entry.intersectionRatio >= 0.25) {
						enqueue(id)
					} else {
						remove(id)
					}
				}
			},
			{ rootMargin: '-80px 0px -40% 0px', threshold: 0.25 },
		)
		for (const card of container.value.querySelectorAll(
			'[data-navigation-card]',
		))
			observer.observe(card)
		window.addEventListener('scroll', onScroll, { passive: true })
	}
	watch([enabled, container], observe, { flush: 'post' })
	onMounted(() => {
		mounted = true
		observe()
		document.addEventListener('visibilitychange', observe)
	})
	onBeforeUnmount(() => {
		clear()
		mounted = false
		document.removeEventListener('visibilitychange', observe)
	})
	return { hints }
}
