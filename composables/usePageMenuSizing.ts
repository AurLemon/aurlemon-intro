import { computed, nextTick, ref, type Ref } from 'vue'

interface PageMenuSizingOptions {
	menuInner: Ref<HTMLElement | null>
	fallbackMeasure: Ref<HTMLElement | null>
	onMeasured: () => void
}

export const usePageMenuSizing = ({
	menuInner,
	fallbackMeasure,
	onMeasured,
}: PageMenuSizingOptions) => {
	const shellWidth = ref<number | null>(null)
	const viewportWidth = ref<number | null>(null)
	const fallbackSlotWidth = ref(0)
	const SIDE_GUTTER = 12
	const MOBILE_SIDE_GUTTER = 12
	const MOBILE_BREAKPOINT = 1024
	const isMobileMenuClamped = computed(() => {
		if (viewportWidth.value === null || shellWidth.value === null) {
			return false
		}

		const contentWidth = shellWidth.value + SIDE_GUTTER * 2
		const maxMobileWidth = viewportWidth.value - MOBILE_SIDE_GUTTER * 2
		return (
			viewportWidth.value < MOBILE_BREAKPOINT && contentWidth > maxMobileWidth
		)
	})

	const menuShellStyle = computed(() => {
		if (shellWidth.value === null) {
			return undefined
		}

		const contentWidth = shellWidth.value + SIDE_GUTTER * 2
		if (
			viewportWidth.value === null ||
			viewportWidth.value >= MOBILE_BREAKPOINT
		) {
			return { width: `${contentWidth}px` }
		}

		const maxMobileWidth = Math.max(
			0,
			viewportWidth.value - MOBILE_SIDE_GUTTER * 2,
		)

		return {
			width: `${Math.min(contentWidth, maxMobileWidth)}px`,
		}
	})

	const measureFallbackWidth = async () => {
		await nextTick()
		const el = fallbackMeasure.value
		if (!el) {
			return
		}

		fallbackSlotWidth.value = Math.ceil(el.scrollWidth)
	}

	const syncFallbackWidth = async () => {
		await measureFallbackWidth()
		void syncShellWidth(false)
	}

	const syncShellWidth = async (animate = true) => {
		if (!import.meta.client) {
			return
		}

		await nextTick()
		const inner = menuInner.value
		if (!inner) {
			return
		}

		const nextWidth = Math.ceil(inner.scrollWidth)
		if (!animate || shellWidth.value === null) {
			shellWidth.value = nextWidth
			onMeasured()
			return
		}

		shellWidth.value = nextWidth
		onMeasured()
	}

	const syncViewportWidth = () => {
		if (!import.meta.client) {
			return
		}

		viewportWidth.value = window.innerWidth
	}

	return {
		fallbackSlotWidth,
		isMobileMenuClamped,
		menuShellStyle,
		syncFallbackWidth,
		syncShellWidth,
		syncViewportWidth,
	}
}
