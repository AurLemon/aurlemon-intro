export interface MobileNavigationHint {
	id: string
	to: string
	labelKey: string
	pageKey: string
}

interface ReadingCard {
	element: HTMLElement
	top: number
	bottom: number
	center: number
	hint?: MobileNavigationHint
}

interface NavigationScrollSample {
	position: number
	time: number
}

export const useMobileCardNavigationStack = (
	container: Ref<HTMLElement | null>,
	enabled: Ref<boolean>,
	definitions: readonly MobileNavigationHint[],
) => {
	const hints = ref<MobileNavigationHint[]>([])
	const fastScrolling = ref(false)
	let scrollSample: NavigationScrollSample | undefined
	let mounted = false
	let scrolling = false
	let collapsed = false
	let activeCard: HTMLElement | undefined
	let cards: ReadingCard[] = []
	let viewportHeight = 0
	let topInset = 0
	const bottomInset = 80
	let layoutDirty = true
	let frame: number | undefined
	let hideTimer: ReturnType<typeof setTimeout> | undefined
	let settleTimer: ReturnType<typeof setTimeout> | undefined
	let observer: IntersectionObserver | undefined
	let resizeObserver: ResizeObserver | undefined
	const visibleCards = new Set<Element>()

	const stopHideTimer = () => {
		if (hideTimer !== undefined) clearTimeout(hideTimer)
		hideTimer = undefined
	}
	const startHideTimer = () => {
		if (
			scrolling ||
			collapsed ||
			!hints.value.length ||
			hideTimer !== undefined
		)
			return
		hideTimer = setTimeout(() => {
			hideTimer = undefined
			collapsed = true
			hints.value = []
		}, 4000)
	}
	const update = () => {
		frame = undefined
		if (!enabled.value || !container.value || document.hidden) return
		const scrollTop = window.scrollY
		if (layoutDirty) {
			layoutDirty = false
			viewportHeight = window.innerHeight
			const header = document.querySelector<HTMLElement>('[data-page-header]')
			// 为 Header 下方的提示栈与底部浮动菜单留出阅读空间。
			topInset = (header?.offsetHeight ?? 64) + 48
			cards = cards.map((card) => {
				const rect = card.element.getBoundingClientRect()
				return {
					...card,
					top: rect.top + scrollTop,
					bottom: rect.bottom + scrollTop,
					center: rect.top + scrollTop + rect.height / 2,
				}
			})
		}
		const viewportTop = scrollTop + topInset
		const viewportBottom = scrollTop + viewportHeight - bottomInset
		const readingPosition =
			scrollTop +
			Math.max(
				topInset,
				Math.min(viewportHeight * 0.4, viewportHeight - bottomInset),
			)
		// 六张卡片共同划分阅读区域，无导航的卡片也必须能接管当前状态。
		const inCardArea =
			cards.length > 0 &&
			readingPosition >= cards[0]!.top &&
			readingPosition <= cards[cards.length - 1]!.bottom
		const current = inCardArea
			? cards.reduce<ReadingCard | undefined>(
					(nearest, card) =>
						!nearest ||
						Math.abs(card.center - readingPosition) <
							Math.abs(nearest.center - readingPosition)
							? card
							: nearest,
					undefined,
				)
			: undefined
		if (current?.element !== activeCard) {
			activeCard = current?.element
			collapsed = false
			stopHideTimer()
		}
		const candidates =
			current?.hint && !collapsed && !fastScrolling.value
				? cards
						.filter((card) => {
							if (!card.hint || !visibleCards.has(card.element)) return false
							const visibleHeight = Math.max(
								0,
								Math.min(card.bottom, viewportBottom) -
									Math.max(card.top, viewportTop),
							)
							return (
								visibleHeight >=
									Math.min(
										card.bottom - card.top,
										Math.max(0, viewportBottom - viewportTop),
									) *
										0.5 && visibleHeight > 0
							)
						})
						.sort((a, b) => {
							// 仅当前阅读卡片提升前排；后层沿用既有顺序，避免随滚动反复换位。
							if (a === current) return -1
							if (b === current) return 1
							const previousA = hints.value.findIndex(
								(hint) => hint.id === a.hint?.id,
							)
							const previousB = hints.value.findIndex(
								(hint) => hint.id === b.hint?.id,
							)
							if (previousA >= 0 || previousB >= 0) {
								return (
									(previousA < 0 ? Infinity : previousA) -
									(previousB < 0 ? Infinity : previousB)
								)
							}
							return (
								Math.abs(a.center - readingPosition) -
								Math.abs(b.center - readingPosition)
							)
						})
						.slice(0, 3)
						.map((card) => card.hint!)
				: []
		if (
			candidates.map((hint) => hint.id).join() !==
			hints.value.map((hint) => hint.id).join()
		)
			hints.value = candidates
		if (!hints.value.length) stopHideTimer()
		else startHideTimer()
	}
	const scheduleUpdate = () => {
		if (frame === undefined) frame = requestAnimationFrame(update)
	}
	const measure = () => {
		layoutDirty = true
		scheduleUpdate()
	}
	const onScroll = () => {
		const sample = { position: window.scrollY, time: performance.now() }
		if (scrollSample) {
			const elapsed = Math.max(8, Math.min(64, sample.time - scrollSample.time))
			const speed = Math.abs(sample.position - scrollSample.position) / elapsed
			// Latch until scrolling settles so decelerating momentum cannot flash hints.
			if (speed > 1.8) fastScrolling.value = true
		}
		scrollSample = sample
		scrolling = true
		stopHideTimer()
		scheduleUpdate()
		if (settleTimer !== undefined) clearTimeout(settleTimer)
		settleTimer = setTimeout(() => {
			settleTimer = undefined
			scrolling = false
			fastScrolling.value = false
			scrollSample = { position: window.scrollY, time: performance.now() }
			scheduleUpdate()
		}, 180)
	}
	const clear = () => {
		observer?.disconnect()
		observer = undefined
		resizeObserver?.disconnect()
		resizeObserver = undefined
		window.removeEventListener('scroll', onScroll)
		window.removeEventListener('resize', measure)
		document.fonts.removeEventListener('loadingdone', measure)
		if (frame !== undefined) cancelAnimationFrame(frame)
		frame = undefined
		if (settleTimer !== undefined) clearTimeout(settleTimer)
		settleTimer = undefined
		stopHideTimer()
		visibleCards.clear()
		cards = []
		activeCard = undefined
		collapsed = false
		scrolling = false
		fastScrolling.value = false
		scrollSample = undefined
		hints.value = []
	}
	const observe = () => {
		if (!mounted) return
		clear()
		if (!enabled.value || !container.value || document.hidden) return
		scrollSample = { position: window.scrollY, time: performance.now() }
		cards = Array.from(
			container.value.querySelectorAll<HTMLElement>('[data-reading-card]'),
			(element) => ({
				element,
				top: 0,
				bottom: 0,
				center: 0,
				hint: definitions.find(
					(hint) => hint.id === element.dataset.navigationCard,
				),
			}),
		)
		observer = new IntersectionObserver((entries) => {
			for (const entry of entries) {
				if (entry.isIntersecting) visibleCards.add(entry.target)
				else visibleCards.delete(entry.target)
			}
			scheduleUpdate()
		})
		resizeObserver = new ResizeObserver(measure)
		for (const card of cards) {
			observer.observe(card.element)
			resizeObserver.observe(card.element)
		}
		resizeObserver.observe(document.body)
		resizeObserver.observe(container.value)
		const header = document.querySelector('[data-page-header]')
		if (header) resizeObserver.observe(header)
		window.addEventListener('scroll', onScroll, { passive: true })
		window.addEventListener('resize', measure)
		document.fonts.addEventListener('loadingdone', measure)
		measure()
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
	return { hints, fastScrolling }
}
