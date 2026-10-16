<template>
	<div ref="viewport" class="min-w-0 overflow-hidden" :title="text">
		<span ref="track" class="block w-max whitespace-nowrap">{{ text }}</span>
	</div>
</template>

<script setup lang="ts">
interface Props {
	text: string
}
const props = defineProps<Props>()
const viewport = ref<HTMLElement | null>(null)
const track = ref<HTMLElement | null>(null)
let animation: Animation | undefined
let resizeObserver: ResizeObserver | undefined
let visibilityObserver: IntersectionObserver | undefined
let motionPreference: MediaQueryList | undefined
let visible = false
let disposed = false
let layout = ''
const syncPlayback = () => {
	if (document.hidden || !visible) animation?.pause()
	else if (animation?.playState === 'paused') animation.play()
}
const update = () => {
	if (disposed || !viewport.value || !track.value) return
	const distance = Math.max(
		0,
		track.value.scrollWidth - viewport.value.clientWidth,
	)
	const nextLayout = `${props.text}:${distance}:${motionPreference?.matches}`
	if (layout === nextLayout) return
	layout = nextLayout
	animation?.cancel()
	animation = undefined
	if (distance <= 1 || motionPreference?.matches) return
	const hold = 1500
	const travel = (distance / 56) * 1000
	const duration = hold * 2 + travel * 2
	animation = track.value.animate(
		[
			{ offset: 0, transform: 'translateX(0)' },
			{ offset: hold / duration, transform: 'translateX(0)' },
			{
				offset: (hold + travel) / duration,
				transform: `translateX(-${distance}px)`,
			},
			{
				offset: (hold * 2 + travel) / duration,
				transform: `translateX(-${distance}px)`,
			},
			{ offset: 1, transform: 'translateX(0)' },
		],
		{ duration, iterations: Infinity, easing: 'linear' },
	)
	syncPlayback()
}
watch(
	() => props.text,
	async () => {
		await nextTick()
		update()
	},
)
onMounted(() => {
	motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
	motionPreference.addEventListener('change', update)
	resizeObserver = new ResizeObserver(update)
	resizeObserver.observe(viewport.value!)
	resizeObserver.observe(track.value!)
	visibilityObserver = new IntersectionObserver((entries) => {
		visible = entries.some((entry) => entry.isIntersecting)
		syncPlayback()
	})
	visibilityObserver.observe(viewport.value!)
	document.addEventListener('visibilitychange', syncPlayback)
	update()
})
onBeforeUnmount(() => {
	disposed = true
	animation?.cancel()
	resizeObserver?.disconnect()
	visibilityObserver?.disconnect()
	motionPreference?.removeEventListener('change', update)
	document.removeEventListener('visibilitychange', syncPlayback)
})
</script>
