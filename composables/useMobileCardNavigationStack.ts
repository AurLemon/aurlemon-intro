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

export const useMobileCardNavigationStack = (
	container: Ref<HTMLElement | null>,
	enabled: Ref<boolean>,
	definitions: readonly MobileNavigationHint[],
) => {
	const hint = shallowRef<MobileNavigationHint>()
	const direction = ref(1)
	let previousScrollTop = 0
	let mounted = false
	let activeCard: HTMLElement | undefined
	let cards: ReadingCard[] = []
	let viewportHeight = 0
	let topInset = 0
	const bottomInset = 80
	let layoutDirty = true
	let frame: number | undefined
	let resizeObserver: ResizeObserver | undefined

	const update = () => {
		frame = undefined
		if (!enabled.value || !container.value || document.hidden) return
		const scrollTop = Math.max(0, window.scrollY)
		const delta = scrollTop - previousScrollTop
		if (Math.abs(delta) >= 1) direction.value = delta > 0 ? 1 : -1
		previousScrollTop = scrollTop
		if (layoutDirty) {
			layoutDirty = false
			viewportHeight = window.innerHeight
			const header = document.querySelector<HTMLElement>('[data-page-header]')
			// 为 Header 下方的提示条与底部浮动菜单留出阅读空间。
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
		let current = inCardArea
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
		// 跨过相邻中心的分界后再前进 24px，避免手指微动导致反复切换。
		const previous = cards.find((card) => card.element === activeCard)
		if (current && previous && current !== previous) {
			const boundary = (current.center + previous.center) / 2
			if (Math.abs(readingPosition - boundary) < 24) current = previous
		}
		activeCard = current?.element
		const visibleHeight = current
			? Math.min(current.bottom, viewportBottom) -
				Math.max(current.top, viewportTop)
			: 0
		hint.value = visibleHeight > 0 ? current?.hint : undefined
	}
	const scheduleUpdate = () => {
		if (frame === undefined) frame = requestAnimationFrame(update)
	}
	const measure = () => {
		layoutDirty = true
		scheduleUpdate()
	}
	const clear = () => {
		resizeObserver?.disconnect()
		resizeObserver = undefined
		window.removeEventListener('scroll', scheduleUpdate)
		window.removeEventListener('resize', measure)
		document.fonts.removeEventListener('loadingdone', measure)
		if (frame !== undefined) cancelAnimationFrame(frame)
		frame = undefined
		cards = []
		activeCard = undefined
		hint.value = undefined
	}
	const observe = () => {
		if (!mounted) return
		clear()
		if (!enabled.value || !container.value || document.hidden) return
		previousScrollTop = Math.max(0, window.scrollY)
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
		resizeObserver = new ResizeObserver(measure)
		for (const card of cards) {
			resizeObserver.observe(card.element)
		}
		resizeObserver.observe(document.body)
		resizeObserver.observe(container.value)
		const header = document.querySelector('[data-page-header]')
		if (header) resizeObserver.observe(header)
		window.addEventListener('scroll', scheduleUpdate, { passive: true })
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
	return { hint, direction }
}
