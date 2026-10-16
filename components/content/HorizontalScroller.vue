<template>
	<div
		class="group/scroller relative isolate min-w-0"
		@pointerdown="touchActive = $event.pointerType === 'touch'"
		@pointerleave="touchActive = false"
	>
		<div
			ref="viewport"
			class="horizontal-scroller overflow-x-auto overscroll-x-contain scroll-smooth motion-reduce:scroll-auto"
			:class="snap ? 'snap-x snap-mandatory' : ''"
			@scroll="handleScroll"
			@scrollend="alignScrollStep"
		>
			<slot />
		</div>
		<CarouselNavigation
			:can-scroll-left="canLeft"
			:can-scroll-right="canRight"
			:show-edge-overlay="showEdgeOverlay"
			:fade-edges="fadeEdges"
			:touch-active="touchActive"
			:compact-swipe-only="compactSwipeOnly"
			@navigate="scroll"
		/>
	</div>
</template>

<script setup lang="ts">
interface Props {
	snap?: boolean
	fadeEdges?: boolean
	showEdgeOverlay?: boolean
	scrollStep?: number
	compactSwipeOnly?: boolean
	itemSelector?: string
}
const props = withDefaults(defineProps<Props>(), {
	snap: false,
	fadeEdges: false,
	showEdgeOverlay: true,
	scrollStep: 0,
	compactSwipeOnly: false,
	itemSelector: undefined,
})
const emit = defineEmits<{ resize: [width: number]; scroll: [] }>()
const viewport = ref<HTMLElement | null>(null)
const canLeft = ref(false)
const canRight = ref(false)
const touchActive = ref(false)
let observer: ResizeObserver | undefined
const updateEdges = () => {
	const el = viewport.value
	if (!el) return
	const max = Math.max(0, el.scrollWidth - el.clientWidth)
	const position = Math.min(max, Math.max(0, el.scrollLeft))
	// Separate show/hide thresholds prevent subpixel edge jitter from reversing fades.
	canLeft.value = canLeft.value ? position > 0.5 : position > 2
	const remaining = max - position
	canRight.value = canRight.value ? remaining > 0.5 : remaining > 2
}
const handleScroll = () => {
	updateEdges()
	emit('scroll')
}
const alignScrollStep = () => {
	const el = viewport.value
	if (!el || props.scrollStep <= 0) return
	const max = Math.max(0, el.scrollWidth - el.clientWidth)
	const target = Math.min(
		max,
		Math.max(
			0,
			Math.round(el.scrollLeft / props.scrollStep) * props.scrollStep,
		),
	)
	if (Math.abs(el.scrollLeft - target) > 0.5) {
		el.scrollTo({ left: target, behavior: 'instant' })
	}
	updateEdges()
}
const scroll = (direction: 'left' | 'right') => {
	const el = viewport.value
	if (!el) return
	const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches
		? 'instant'
		: 'smooth'
	if (props.itemSelector) {
		const items = Array.from(
			el.querySelectorAll<HTMLElement>(props.itemSelector),
		)
		const origin = items[0]?.offsetLeft ?? 0
		let nearest = 0
		for (let index = 1; index < items.length; index++) {
			if (
				Math.abs(
					(items[index]?.offsetLeft ?? origin) - origin - el.scrollLeft,
				) <
				Math.abs(
					(items[nearest]?.offsetLeft ?? origin) - origin - el.scrollLeft,
				)
			)
				nearest = index
		}
		const target =
			items[
				Math.max(
					0,
					Math.min(items.length - 1, nearest + (direction === 'left' ? -1 : 1)),
				)
			]
		if (target) el.scrollTo({ left: target.offsetLeft - origin, behavior })
		return
	}
	el.scrollBy({
		left:
			(direction === 'left' ? -1 : 1) *
			(props.scrollStep > 0
				? Math.max(1, Math.floor((el.clientWidth + 4) / props.scrollStep)) *
					props.scrollStep
				: el.clientWidth),
		behavior,
	})
}
onMounted(() => {
	observer = new ResizeObserver(() => {
		emit('resize', viewport.value?.clientWidth ?? 0)
		updateEdges()
	})
	if (viewport.value) observer.observe(viewport.value)
	updateEdges()
})
onBeforeUnmount(() => observer?.disconnect())
defineExpose({ viewport, updateEdges })
</script>

<style scoped>
.horizontal-scroller {
	scrollbar-width: none;
}
.horizontal-scroller::-webkit-scrollbar {
	display: none;
}
</style>
