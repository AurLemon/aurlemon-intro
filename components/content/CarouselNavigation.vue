<template>
	<div class="contents">
		<template v-for="direction in directions" :key="direction">
			<div
				v-if="showEdgeOverlay && !(direction === 'left' && hideLeftEdgeOverlay)"
				class="pointer-events-none absolute inset-y-0 z-10 overflow-hidden transition-[width] duration-400 motion-reduce:transition-none"
				:class="[
					compactSwipeOnly || hideCompactEdges ? 'max-lg:hidden' : '',
					strongEdgeOverlay && canScrollLeft && canScrollRight
						? 'w-24 sm:w-32'
						: 'w-12 sm:w-16',
					direction === 'left'
						? 'left-0 carousel-edge-left'
						: 'right-0 carousel-edge-right',
					{
						'carousel-edge-visible':
							canScroll(direction) && (fadeEdges || !hoverOnly || touchActive),
						'carousel-edge-hover':
							canScroll(direction) && hoverOnly && !fadeEdges,
					},
				]"
			>
				<span
					class="carousel-edge-fill absolute inset-0 transition-transform duration-400 ease-in-out motion-reduce:transition-none"
				/>
			</div>
			<button
				type="button"
				class="absolute z-20 flex -translate-y-1/2 touch-manipulation items-center justify-center rounded-full bg-white/90 text-slate-600 shadow-lg ring-1 ring-slate-200/80 backdrop-blur transition duration-200 hover:bg-white hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-primary dark:bg-slate-950/80 dark:text-slate-300 dark:ring-white/10 dark:hover:bg-slate-950 dark:hover:text-slate-50 motion-reduce:transition-none"
				:class="[
					buttonPositionClass,
					small ? 'size-8' : 'size-10',
					compactSwipeOnly ? 'max-lg:hidden' : '',
					direction === 'left' ? 'left-3' : 'right-3',
					buttonClasses(direction),
				]"
				:style="buttonStyle"
				:aria-label="
					$t(
						`content.imageCarousel.${direction === 'left' ? 'scrollLeft' : 'scrollRight'}`,
					)
				"
				:tabindex="buttonHidden(direction) ? -1 : 0"
				@click.stop="emit('navigate', direction)"
			>
				<UIcon
					:name="
						direction === 'left'
							? 'i-lucide-chevron-left'
							: 'i-lucide-chevron-right'
					"
					:class="small ? 'size-4' : 'text-xl'"
				/>
			</button>
		</template>
	</div>
</template>

<script setup lang="ts">
import type { CSSProperties } from 'vue'
interface Props {
	canScrollLeft: boolean
	canScrollRight: boolean
	showEdgeOverlay?: boolean
	strongEdgeOverlay?: boolean
	hideLeftEdgeOverlay?: boolean
	fadeEdges?: boolean
	hoverOnly?: boolean
	touchActive?: boolean
	compactSwipeOnly?: boolean
	hideCompactEdges?: boolean
	small?: boolean
	buttonPositionClass?: string
	buttonStyle?: CSSProperties
	leftButtonClass?: string
	rightButtonClass?: string
}
const props = withDefaults(defineProps<Props>(), {
	showEdgeOverlay: true,
	strongEdgeOverlay: false,
	hideLeftEdgeOverlay: false,
	fadeEdges: false,
	hoverOnly: true,
	touchActive: false,
	compactSwipeOnly: false,
	hideCompactEdges: false,
	small: true,
	buttonPositionClass: 'top-1/2',
	buttonStyle: undefined,
	leftButtonClass: '',
	rightButtonClass: '',
})
const emit = defineEmits<{ navigate: [direction: 'left' | 'right'] }>()
const directions = ['left', 'right'] as const
const canScroll = (direction: 'left' | 'right') =>
	direction === 'left' ? props.canScrollLeft : props.canScrollRight
const customButtonClass = (direction: 'left' | 'right') =>
	direction === 'left' ? props.leftButtonClass : props.rightButtonClass
const buttonHidden = (direction: 'left' | 'right') =>
	customButtonClass(direction)
		? customButtonClass(direction).includes('pointer-events-none')
		: !canScroll(direction)
const buttonClasses = (direction: 'left' | 'right') => {
	if (customButtonClass(direction)) return customButtonClass(direction)
	if (!canScroll(direction)) return 'pointer-events-none scale-90 opacity-0'
	if (!props.hoverOnly || props.touchActive)
		return 'pointer-events-auto scale-100 opacity-100'
	return 'pointer-events-none scale-90 opacity-0 group-hover/scroller:pointer-events-auto group-hover/scroller:scale-100 group-hover/scroller:opacity-100 group-focus-within/scroller:pointer-events-auto group-focus-within/scroller:scale-100 group-focus-within/scroller:opacity-100'
}
</script>

<style scoped>
.carousel-edge-left .carousel-edge-fill {
	background: linear-gradient(
		to right,
		var(--color-surface-0) 15%,
		transparent
	);
	transform: translateX(-100%);
}
.carousel-edge-right .carousel-edge-fill {
	background: linear-gradient(to left, var(--color-surface-0) 15%, transparent);
	transform: translateX(100%);
}
.carousel-edge-visible .carousel-edge-fill,
:global(.group\/scroller:hover) .carousel-edge-hover .carousel-edge-fill,
:global(.group\/scroller:focus-within)
	.carousel-edge-hover
	.carousel-edge-fill {
	transform: translateX(0);
}

.content-image-carousel-nav-button {
	top: calc(var(--content-image-nav-height) / 2);
}
@media (max-width: 767.98px) {
	.content-image-carousel-nav-button {
		top: calc(
			var(--content-image-nav-mobile-height, var(--content-image-nav-height)) /
				2
		);
	}
}
</style>
