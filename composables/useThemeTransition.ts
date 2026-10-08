import { nextTick, onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'

interface ThemeTransitionController {
	applyThemeChange: (update: () => void) => Promise<void>
	isTransitioning: Readonly<Ref<boolean>>
}

export const useThemeTransition = (): ThemeTransitionController => {
	const colorMode = useColorMode()
	const isTransitioning = ref(false)
	let mounted = false
	let cleanupTimer: ReturnType<typeof setTimeout> | undefined
	let activeTransition: ViewTransition | null = null
	let generation = 0

	const clearColorTransition = (): void => {
		if (cleanupTimer !== undefined) clearTimeout(cleanupTimer)
		cleanupTimer = undefined
		if (import.meta.client) {
			document.documentElement.removeAttribute('data-theme-transition')
		}
	}

	const shouldAnimate = (): boolean =>
		import.meta.client &&
		!document.hidden &&
		!window.matchMedia('(prefers-reduced-motion: reduce)').matches

	const beginColorTransition = (): void => {
		clearColorTransition()
		document.documentElement.setAttribute('data-theme-transition', 'colors')
		// Commit the transition rules before color-mode changes the theme class.
		void getComputedStyle(document.documentElement).backgroundColor
		cleanupTimer = setTimeout(clearColorTransition, 520)
	}

	// Also smooth changes caused by the OS while following the system theme.
	watch(
		() => colorMode.value,
		(value, previous) => {
			if (
				mounted &&
				value !== previous &&
				shouldAnimate() &&
				!activeTransition
			) {
				beginColorTransition()
			}
		},
		{ flush: 'sync' },
	)

	const applyThemeChange = async (update: () => void): Promise<void> => {
		const currentGeneration = ++generation
		activeTransition?.skipTransition()
		activeTransition = null
		clearColorTransition()
		if (!shouldAnimate()) {
			isTransitioning.value = false
			update()
			return
		}

		if (typeof document.startViewTransition !== 'function') {
			beginColorTransition()
			update()
			await nextTick()
			return
		}

		isTransitioning.value = true
		document.documentElement.setAttribute('data-theme-transition', 'snapshot')
		activeTransition = document.startViewTransition(async () => {
			if (generation !== currentGeneration) return
			update()
			await nextTick()
		})
		// A skipped transition still applies its theme update.
		void activeTransition.ready.catch(() => {})
		await activeTransition.finished.catch(() => {})
		if (generation === currentGeneration) {
			isTransitioning.value = false
			activeTransition = null
			clearColorTransition()
		}
	}

	onMounted(() => {
		mounted = true
	})

	onBeforeUnmount(() => {
		generation++
		activeTransition?.skipTransition()
		clearColorTransition()
	})

	return { applyThemeChange, isTransitioning }
}
