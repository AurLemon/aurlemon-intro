import { computed, ref, watch, onMounted, onBeforeUnmount, type Ref } from 'vue'
import { useSpring, useTransform } from 'motion-v'

interface ScrollSample {
	position: number
	time: number
	velocity: number
}

interface PageMenuScrollMotionOptions {
	menuVisible: Ref<boolean>
	prefersReducedMotion: Ref<boolean>
	menuPressed: Ref<boolean>
}

export const usePageMenuScrollMotion = ({
	menuVisible,
	prefersReducedMotion,
	menuPressed,
}: PageMenuScrollMotionOptions) => {
	const menuHovered = ref(false)
	const menuFocused = ref(false)
	const scrollFollowPaused = computed(
		() =>
			!menuVisible.value ||
			prefersReducedMotion.value ||
			menuHovered.value ||
			menuFocused.value ||
			menuPressed.value,
	)
	const scrollSpring = useSpring(0, { stiffness: 280, damping: 20, mass: 1 })
	const scrollOffset = useTransform(scrollSpring, (value) =>
		Math.max(-4.5, Math.min(4.5, Number(value))),
	)
	const SCROLL_IDLE_MS = 180
	let scrollSample: ScrollSample | null = null
	let scrollIdleTimer: ReturnType<typeof setTimeout> | null = null

	const resetScrollFollow = (immediate = false) => {
		if (scrollIdleTimer) {
			clearTimeout(scrollIdleTimer)
			scrollIdleTimer = null
		}
		if (scrollSample) {
			scrollSample.velocity = 0
		}
		if (immediate) {
			scrollSpring.jump(0)
		} else {
			scrollSpring.set(0)
		}
	}

	const updateScrollFollow = (time: number) => {
		const doc = document.documentElement
		const maxScroll = Math.max(0, doc.scrollHeight - window.innerHeight)
		const position = Math.max(0, Math.min(maxScroll, window.scrollY))
		const previous = scrollSample
		scrollSample = { position, time, velocity: 0 }
		if (!previous || scrollFollowPaused.value) {
			return
		}
		const delta = position - previous.position
		// Anchor jumps and route restoration are not scroll gestures.
		if (Math.abs(delta) > window.innerHeight * 1.5) {
			resetScrollFollow(true)
			return
		}
		const elapsed = time - previous.time
		const frameTime = elapsed > SCROLL_IDLE_MS ? 16.7 : Math.max(8, elapsed)
		const blend = 1 - Math.exp(-frameTime / 45)
		const velocity =
			previous.velocity +
			((delta / frameTime) * 1000 - previous.velocity) * blend
		scrollSample.velocity = velocity
		const speed = Math.max(0, Math.abs(velocity) - 120)
		scrollSpring.set(-3.5 * Math.sign(velocity) * Math.tanh(speed / 900))
		if (scrollIdleTimer) {
			clearTimeout(scrollIdleTimer)
		}
		scrollIdleTimer = setTimeout(() => resetScrollFollow(), SCROLL_IDLE_MS)
	}

	const onMenuPointerEnter = (event: PointerEvent) => {
		if (event.pointerType !== 'touch') {
			menuHovered.value = true
		}
	}

	const onMenuFocusOut = (event: FocusEvent) => {
		menuFocused.value =
			event.currentTarget instanceof HTMLElement &&
			event.relatedTarget instanceof HTMLElement &&
			event.currentTarget.contains(event.relatedTarget) &&
			event.relatedTarget.matches(':focus-visible')
	}

	const onMenuFocusIn = (event: FocusEvent) => {
		// Pointer navigation retains DOM focus without indicating keyboard use.
		menuFocused.value =
			event.target instanceof HTMLElement &&
			event.target.matches(':focus-visible')
	}

	const onMenuPointerDown = () => {
		// Clicking an already-focused link does not fire focusin again.
		menuFocused.value = false
	}

	watch(scrollFollowPaused, () => {
		resetScrollFollow(prefersReducedMotion.value)
	})

	const resetScrollTracking = () => {
		resetScrollFollow(true)
		scrollSample = null
	}
	onMounted(() => {
		scrollSample = {
			position: window.scrollY,
			time: performance.now(),
			velocity: 0,
		}
	})
	onBeforeUnmount(() => resetScrollFollow(true))
	return {
		menuHovered,
		menuFocused,
		scrollOffset,
		updateScrollFollow,
		resetScrollTracking,
		onMenuPointerEnter,
		onMenuPointerDown,
		onMenuFocusIn,
		onMenuFocusOut,
	}
}
