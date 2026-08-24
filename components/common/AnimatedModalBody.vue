<template>
	<div
		class="overflow-hidden transition-[height] duration-300 ease-out motion-reduce:transition-none"
		:style="wrapperStyle"
	>
		<div
			ref="contentRef"
			:class="contentTransitioning ? 'modal-body-content-transition' : ''"
		>
			<slot />
		</div>
	</div>
</template>

<script setup lang="ts">
const contentRef = ref<HTMLElement | null>(null)
const height = ref<number | null>(null)
const contentTransitioning = ref(false)
let observer: ResizeObserver | null = null
let animationFrame = 0
let animationTimer: ReturnType<typeof setTimeout> | null = null

const wrapperStyle = computed(() =>
	height.value === null ? undefined : { height: `${height.value}px` },
)

const syncHeight = (nextHeight: number): void => {
	if (height.value !== null && Math.abs(height.value - nextHeight) < 1) {
		return
	}

	const shouldAnimateContent = height.value !== null
	height.value = nextHeight
	if (!shouldAnimateContent) return

	cancelAnimationFrame(animationFrame)
	if (animationTimer !== null) clearTimeout(animationTimer)
	contentTransitioning.value = false
	animationFrame = requestAnimationFrame(() => {
		contentTransitioning.value = true
		animationTimer = setTimeout(() => {
			contentTransitioning.value = false
			animationTimer = null
		}, 300)
	})
}

onMounted(async () => {
	await nextTick()
	const content = contentRef.value
	if (!content) return

	syncHeight(content.getBoundingClientRect().height)
	observer = new ResizeObserver(([entry]) => {
		if (entry) {
			syncHeight(entry.borderBoxSize[0]?.blockSize ?? entry.contentRect.height)
		}
	})
	observer.observe(content)
})

onBeforeUnmount(() => {
	observer?.disconnect()
	cancelAnimationFrame(animationFrame)
	if (animationTimer !== null) clearTimeout(animationTimer)
})
</script>

<style scoped>
.modal-body-content-transition {
	animation: modal-body-content-enter 300ms ease-out;
}

@keyframes modal-body-content-enter {
	from {
		opacity: 0;
		transform: translateY(0.25rem);
	}
}

@media (prefers-reduced-motion: reduce) {
	.modal-body-content-transition {
		animation: none;
	}
}
</style>
