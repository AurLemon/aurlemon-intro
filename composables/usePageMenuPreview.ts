import { computed, onBeforeUnmount, ref, type Ref } from 'vue'

interface PillBounds {
	x: number
	y: number
	width: number
	height: number
}

interface MenuPointerSample {
	clientX: number
	clientY: number
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

	const menuPressed = ref(false)
	let menuGesture: MenuGesture | null = null
	let suppressGestureClick = false
	let previewLink: HTMLElement | null = null
	let geometry = new Map<HTMLElement, PillBounds>()
	let innerWidth = 0
	let previewRaf = 0
	let pointerSample: MenuPointerSample | null = null

	const measureGeometry = () => {
		const inner = menuInner.value
		innerWidth = inner?.offsetWidth ?? 0
		geometry = new Map()
		if (!inner || !innerWidth) return
		for (const link of inner.querySelectorAll<HTMLElement>(
			'[data-menu-link]',
		)) {
			geometry.set(link, {
				x: link.offsetLeft + 1,
				y: link.offsetTop + 4,
				width: Math.max(0, link.offsetWidth - 2),
				height: Math.max(0, link.offsetHeight - 8),
			})
		}
	}

	const pillStyle = (
		bounds: PillBounds | null,
		visible: boolean,
		scale = 1,
	) => ({
		width: `${bounds?.width ?? 0}px`,
		height: `${bounds?.height ?? 0}px`,
		transform: `translate3d(${bounds?.x ?? 0}px, ${bounds?.y ?? 0}px, 0) scale(${scale})`,
		opacity: visible ? 1 : 0,
	})
	const selectedPillStyle = computed(() =>
		pillStyle(selectedPill.value, !!selectedPill.value),
	)
	const previewPillStyle = computed(() =>
		pillStyle(
			previewPill.value ?? previewOrigin.value,
			!!previewPill.value,
			prefersReducedMotion.value
				? 1
				: previewPill.value
					? menuPressed.value
						? 0.985
						: 1
					: 0.97,
		),
	)

	const showPreview = (bounds: PillBounds, origin = bounds) => {
		if (!previewPill.value) {
			previewOrigin.value = origin
		}
		previewPill.value = bounds
	}

	const getPillBounds = (link: HTMLElement): PillBounds | null => {
		if (!geometry.size) measureGeometry()
		return geometry.get(link) ?? null
	}

	const syncPills = () => {
		measureGeometry()
		const active = menuInner.value?.querySelector<HTMLElement>(
			'[data-menu-link][aria-current="page"]',
		)
		selectedPill.value = active ? getPillBounds(active) : null
		if (previewLink?.isConnected) {
			previewPill.value = getPillBounds(previewLink)
		}
	}

	const clearPreview = () => {
		if (previewRaf) cancelAnimationFrame(previewRaf)
		previewRaf = 0
		pointerSample = null
		if (previewPill.value) previewOrigin.value = previewPill.value
		previewLink = null
		previewPill.value = null
		menuPressed.value = false
	}

	const previewAtPointer = (event: MenuPointerSample) => {
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
		if (!geometry.size) measureGeometry()
		const links = [...geometry.keys()]
		const inner = menuInner.value
		if (!inner || !innerWidth) return
		const parent = inner.getBoundingClientRect()
		const scale = parent.width / innerWidth || 1
		const pointerX = (event.clientX - parent.left) / scale
		const link = links.reduce<HTMLElement | null>((closest, item) => {
			const distance = (el: HTMLElement) => {
				const bounds = geometry.get(el)!
				return Math.abs(pointerX - (bounds.x + bounds.width / 2))
			}
			return !closest || distance(item) < distance(closest) ? item : closest
		}, null)
		if (!link) return
		previewLink = link
		const bounds = getPillBounds(link)
		if (!bounds) return
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
		const x = Math.max(1, Math.min(innerWidth - width - 1, centre - width / 2))
		const originX = Math.max(
			1,
			Math.min(innerWidth - width - 1, pointerX - width / 2),
		)
		showPreview({ ...bounds, width, x }, { ...bounds, width, x: originX })
	}

	// Pointermove may arrive several times per frame; read geometry and publish once.
	const schedulePreview = (event: PointerEvent) => {
		pointerSample = { clientX: event.clientX, clientY: event.clientY }
		if (previewRaf) return
		previewRaf = requestAnimationFrame(() => {
			previewRaf = 0
			if (pointerSample) previewAtPointer(pointerSample)
			pointerSample = null
		})
	}
	onBeforeUnmount(() => {
		if (previewRaf) cancelAnimationFrame(previewRaf)
	})

	const onPreviewPointerEnter = (event: PointerEvent) => {
		if (event.isPrimary && event.pointerType !== 'touch') schedulePreview(event)
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
		schedulePreview(event)
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
		selectedPillStyle,
		previewPillStyle,
		previewPill,
		previewOrigin,
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
