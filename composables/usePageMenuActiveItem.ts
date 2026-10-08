import { nextTick, onBeforeUnmount, type Ref } from 'vue'

interface PageMenuActiveItemOptions {
	menuViewport: Ref<HTMLElement | null>
}

export const usePageMenuActiveItem = ({
	menuViewport,
}: PageMenuActiveItemOptions) => {
	const MENU_SHELL_TRANSITION_MS = 500
	let activeItemScrollRaf = 0
	let activeItemScrollTimer: ReturnType<typeof setTimeout> | null = null
	let activeItemFollowupScrollTimer: ReturnType<typeof setTimeout> | null = null
	const scrollActiveItemIntoView = (behavior: ScrollBehavior = 'smooth') => {
		if (!import.meta.client) {
			return
		}

		const container = menuViewport.value
		if (!container || container.scrollWidth <= container.clientWidth + 1) {
			return
		}

		const activeItem = container.querySelector<HTMLElement>(
			'[data-menu-link][aria-current="page"]',
		)
		if (!activeItem) {
			return
		}

		const containerRect = container.getBoundingClientRect()
		const activeRect = activeItem.getBoundingClientRect()
		const currentScrollLeft = container.scrollLeft
		const maxScrollLeft = Math.max(
			0,
			container.scrollWidth - container.clientWidth,
		)
		const activeLeft = activeRect.left - containerRect.left + currentScrollLeft
		const activeRight =
			activeRect.right - containerRect.left + currentScrollLeft
		const visibleLeft = currentScrollLeft
		const visibleRight = currentScrollLeft + container.clientWidth
		const viewportPadding = 8

		if (
			activeLeft >= visibleLeft + viewportPadding &&
			activeRight <= visibleRight - viewportPadding
		) {
			return
		}

		const targetScrollLeft =
			activeRect.width >= container.clientWidth - viewportPadding * 2
				? activeLeft - (container.clientWidth - activeRect.width) / 2
				: activeLeft < visibleLeft + viewportPadding
					? activeLeft - viewportPadding
					: activeRight - container.clientWidth + viewportPadding

		container.scrollTo({
			left: Math.min(maxScrollLeft, Math.max(0, targetScrollLeft)),
			behavior,
		})
	}

	const scheduleScrollActiveItemIntoView = (
		behavior: ScrollBehavior = 'smooth',
		delay = 0,
	) => {
		if (!import.meta.client) {
			return
		}

		if (activeItemScrollTimer) {
			clearTimeout(activeItemScrollTimer)
			activeItemScrollTimer = null
		}

		if (activeItemScrollRaf) {
			window.cancelAnimationFrame(activeItemScrollRaf)
		}

		const run = () => {
			activeItemScrollRaf = window.requestAnimationFrame(async () => {
				activeItemScrollRaf = 0
				await nextTick()
				scrollActiveItemIntoView(behavior)
			})
		}

		if (delay > 0) {
			activeItemScrollTimer = setTimeout(() => {
				activeItemScrollTimer = null
				run()
			}, delay)
			return
		}

		run()
	}

	const scheduleFollowupScrollActiveItemIntoView = (
		behavior: ScrollBehavior = 'smooth',
		delay = MENU_SHELL_TRANSITION_MS,
	) => {
		if (!import.meta.client) {
			return
		}

		if (activeItemFollowupScrollTimer) {
			clearTimeout(activeItemFollowupScrollTimer)
		}

		activeItemFollowupScrollTimer = setTimeout(() => {
			activeItemFollowupScrollTimer = null
			scheduleScrollActiveItemIntoView(behavior)
		}, delay)
	}

	onBeforeUnmount(() => {
		if (activeItemScrollRaf) window.cancelAnimationFrame(activeItemScrollRaf)
		if (activeItemScrollTimer) clearTimeout(activeItemScrollTimer)
		if (activeItemFollowupScrollTimer)
			clearTimeout(activeItemFollowupScrollTimer)
	})
	return {
		scheduleScrollActiveItemIntoView,
		scheduleFollowupScrollActiveItemIntoView,
	}
}
