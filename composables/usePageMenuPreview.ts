import { computed, ref, type Ref } from 'vue'
import type { Options } from 'motion-v'

interface PillBounds {
	x: number
	y: number
	width: number
	height: number
}

interface MenuGesture {
	id: number
	type: string
	x: number
	y: number
	time: number
	scrollLeft: number
	moved: boolean
}

interface PageMenuPreviewOptions {
	menuViewport: Ref<HTMLElement | null>
	menuInner: Ref<HTMLElement | null>
	isMobileMenuClamped: Ref<boolean>
	prefersReducedMotion: Ref<boolean>
}

export const usePageMenuPreview = ({
	menuViewport,
	menuInner,
	isMobileMenuClamped,
	prefersReducedMotion,
}: PageMenuPreviewOptions) => {
	const selectedPill = ref<PillBounds | null>(null)
	const previewPill = ref<PillBounds | null>(null)
	const previewOrigin = ref<PillBounds | null>(null)
	const previewSession = ref(0)
	const menuPressed = ref(false)
	let menuGesture: MenuGesture | null = null
	let suppressGestureClick = false
	let previewLink: HTMLElement | null = null

	const pillTransition = computed(() =>
		prefersReducedMotion.value
			? { duration: 0 }
			: {
					type: 'spring' as const,
					stiffness: 260,
					damping: 25,
					mass: 1,
					opacity: { duration: 0.12 },
					width: {
						type: 'tween' as const,
						duration: 0.22,
						ease: 'easeOut' as const,
					},
					height: { duration: 0 },
				},
	)
	const selectedPillMotion = computed<Options>(() => ({
		initial: false,
		animate: { ...selectedPill.value, opacity: selectedPill.value ? 1 : 0 },
		transition: pillTransition.value,
	}))
	const previewTransition = computed(() =>
		prefersReducedMotion.value
			? { duration: 0 }
			: {
					type: 'spring' as const,
					stiffness: 360,
					damping: 34,
					mass: 0.9,
					opacity: { duration: 0.18, ease: 'easeOut' as const },
				},
	)

	const showPreview = (bounds: PillBounds, origin = bounds) => {
		if (!previewPill.value) {
			previewOrigin.value = origin
			previewSession.value += 1
		}
		previewPill.value = bounds
	}

	const getPillBounds = (link: HTMLElement): PillBounds | null => {
		const inner = menuInner.value
		if (!inner || !inner.offsetWidth) return null
		const parent = inner.getBoundingClientRect()
		const bounds = link.getBoundingClientRect()
		const scale = parent.width / inner.offsetWidth || 1
		return {
			x: (bounds.left - parent.left) / scale + 1,
			y: (bounds.top - parent.top) / scale + 4,
			width: Math.max(0, bounds.width / scale - 2),
			height: Math.max(0, bounds.height / scale - 8),
		}
	}

	const syncPills = () => {
		const active = menuInner.value?.querySelector<HTMLElement>(
			'[data-menu-link][aria-current="page"]',
		)
		selectedPill.value = active ? getPillBounds(active) : null
		if (previewLink?.isConnected) {
			previewPill.value = getPillBounds(previewLink)
		}
	}

	const clearPreview = () => {
		previewLink = null
		previewPill.value = null
		menuPressed.value = false
	}

	const previewAtPointer = (event: PointerEvent) => {
		const viewport = menuViewport.value
		if (!viewport) return
		const area = viewport.getBoundingClientRect()
		if (
			event.clientX < area.left ||
			event.clientX > area.right ||
			event.clientY < area.top ||
			event.clientY > area.bottom
		) {
			clearPreview()
			return
		}
		const links = [
			...viewport.querySelectorAll<HTMLElement>('[data-menu-link]'),
		]
		const link = links.reduce<HTMLElement | null>((closest, item) => {
			const center = (el: HTMLElement) => {
				const box = el.getBoundingClientRect()
				return Math.abs(event.clientX - (box.left + box.width / 2))
			}
			return !closest || center(item) < center(closest) ? item : closest
		}, null)
		if (!link) return
		previewLink = link
		const bounds = getPillBounds(link)
		if (!bounds) return
		const inner = menuInner.value
		if (!inner) return
		const parent = inner.getBoundingClientRect()
		const scale = parent.width / inner.offsetWidth || 1
		const pointerX = (event.clientX - parent.left) / scale
		// Blend nearby item centres continuously instead of snapping at their midpoint.
		let weightSum = 0
		let centreSum = 0
		let widthSum = 0
		for (const item of links) {
			const itemBounds = getPillBounds(item)
			if (!itemBounds) continue
			const centre = itemBounds.x + itemBounds.width / 2
			const weight = Math.exp(-(((pointerX - centre) / 40) ** 2) / 2)
			weightSum += weight
			centreSum += centre * weight
			widthSum += itemBounds.width * weight
		}
		const width = Math.max(
			0,
			(weightSum ? widthSum / weightSum : bounds.width) - 6,
		)
		const centre = prefersReducedMotion.value
			? bounds.x + bounds.width / 2
			: pointerX * 0.65 + (weightSum ? centreSum / weightSum : pointerX) * 0.35
		const x = Math.max(
			1,
			Math.min(inner.offsetWidth - width - 1, centre - width / 2),
		)
		const originX = Math.max(
			1,
			Math.min(inner.offsetWidth - width - 1, pointerX - width / 2),
		)
		showPreview({ ...bounds, width, x }, { ...bounds, width, x: originX })
	}

	const onPreviewPointerEnter = (event: PointerEvent) => {
		if (event.isPrimary && event.pointerType !== 'touch')
			previewAtPointer(event)
	}

	const onPreviewPointerDown = (event: PointerEvent) => {
		if (!event.isPrimary || event.button !== 0) return
		suppressGestureClick = false
		menuGesture = {
			id: event.pointerId,
			type: event.pointerType,
			x: event.clientX,
			y: event.clientY,
			time: performance.now(),
			scrollLeft: menuViewport.value?.scrollLeft ?? 0,
			moved: false,
		}
		menuPressed.value = true
		previewAtPointer(event)
	}

	const onPreviewPointerMove = (event: PointerEvent) => {
		if (!event.isPrimary || (event.pointerType === 'touch' && !menuGesture))
			return
		if (menuGesture?.id === event.pointerId) {
			const delta = event.clientX - menuGesture.x
			if (Math.hypot(delta, event.clientY - menuGesture.y) > 8) {
				menuGesture.moved = true
				menuViewport.value?.setPointerCapture(event.pointerId)
			}
			if (
				menuGesture.type === 'touch' &&
				isMobileMenuClamped.value &&
				menuViewport.value
			) {
				menuViewport.value.scrollLeft = menuGesture.scrollLeft - delta
			}
		}
		previewAtPointer(event)
	}

	const onPreviewPointerUp = (event: PointerEvent) => {
		if (menuGesture?.id !== event.pointerId) return
		suppressGestureClick =
			menuGesture.moved ||
			(menuGesture.type === 'touch' &&
				performance.now() - menuGesture.time > 350)
		menuGesture = null
		menuPressed.value = false
		if (menuViewport.value?.hasPointerCapture(event.pointerId))
			menuViewport.value.releasePointerCapture(event.pointerId)
		if (event.pointerType === 'touch') clearPreview()
	}

	const onPreviewPointerCancel = () => {
		menuGesture = null
		suppressGestureClick = false
		clearPreview()
	}

	const onMenuClickCapture = (event: MouseEvent) => {
		if (suppressGestureClick && event.detail !== 0) {
			event.preventDefault()
			event.stopPropagation()
		}
		suppressGestureClick = false
	}

	const onPreviewFocus = (event: FocusEvent) => {
		const link =
			event.target instanceof HTMLElement
				? event.target.closest<HTMLElement>('[data-menu-link]')
				: null
		if (link) {
			previewLink = link
			const bounds = getPillBounds(link)
			if (bounds) showPreview(bounds)
		}
	}

	return {
		selectedPillMotion,
		previewPill,
		previewOrigin,
		previewSession,
		previewTransition,
		menuPressed,
		syncPills,
		clearPreview,
		onPreviewPointerEnter,
		onPreviewPointerDown,
		onPreviewPointerMove,
		onPreviewPointerUp,
		onPreviewPointerCancel,
		onMenuClickCapture,
		onPreviewFocus,
	}
}
