import { computed, nextTick, ref, type Ref } from 'vue'

interface PageMenuSizingOptions {
	mobileMeasure: Ref<HTMLElement | null>
	menuBase: Ref<HTMLElement | null>
	fallbackMeasure: Ref<HTMLElement | null>
	onMeasured: () => void
}

export const usePageMenuSizing = ({
	mobileMeasure,
	menuBase,
	fallbackMeasure,
	onMeasured,
}: PageMenuSizingOptions) => {
	const shellWidth = ref<number | null>(null)
	const mobileWidth = ref<number | null>(null)
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

	const menuShellStyle = computed(() => ({
		'--desktop-menu-width':
			shellWidth.value === null
				? undefined
				: `${shellWidth.value + SIDE_GUTTER * 2}px`,
		'--mobile-menu-width':
			mobileWidth.value === null
				? undefined
				: `${mobileWidth.value + SIDE_GUTTER * 2}px`,
	}))

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
		void syncShellWidth()
	}

	const syncShellWidth = async () => {
		if (!import.meta.client) {
			return
		}

		await nextTick()
		const base = menuBase.value
		if (!base) {
			return
		}

		// Use target geometry, never the extra slot's intermediate animated width.
		// offsetWidth excludes decorative pills overflowing the positioned menu inner.
		shellWidth.value = base.offsetWidth + fallbackSlotWidth.value
		mobileWidth.value = mobileMeasure.value?.offsetWidth ?? null
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
