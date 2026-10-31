<template>
	<h2
		class="w-full min-w-0 text-xl leading-7 font-medium text-slate-900 dark:text-slate-100"
	>
		<span class="relative block w-fit min-w-0 max-w-[calc(100%_-_0.875rem)]">
			<span ref="viewport" class="friend-title block min-w-0 overflow-hidden">
				<span ref="track" class="block w-max whitespace-pre">{{ text }}</span>
			</span>
			<UIcon
				name="i-lucide-arrow-up-right"
				class="absolute top-1/2 left-[calc(100%_+_0.375rem)] m-0 size-4 -translate-y-1/2 p-0 text-slate-700 dark:text-slate-300"
				aria-hidden="true"
			/>
		</span>
	</h2>
</template>

<script setup lang="ts">
interface Props {
	text: string
}
const props = defineProps<Props>()
const viewport = ref<HTMLElement | null>(null)
const track = ref<HTMLElement | null>(null)
let resizeObserver: ResizeObserver | undefined
let visibilityObserver: IntersectionObserver | undefined
let motionPreference: MediaQueryList | undefined
let frame = 0
let distance = 0
let elapsed = 0
let previousTime = 0
let visible = false
let disposed = false
const hold = 1500
const speed = 56
const render = (position: number) => {
	if (!viewport.value || !track.value) return
	track.value.style.transform = `translateX(-${position}px)`
	// 渐隐只占用当前被裁切的一侧，首尾不预留 padding 或空隙。
	viewport.value.style.setProperty(
		'--title-fade-left',
		`${Math.min(12, position)}px`,
	)
	viewport.value.style.setProperty(
		'--title-fade-right',
		`${Math.min(12, Math.max(0, distance - position))}px`,
	)
}
const tick = (time: number) => {
	if (previousTime) elapsed += time - previousTime
	previousTime = time
	const travel = (distance / speed) * 1000
	const phase = elapsed % (hold * 2 + travel * 2)
	const position =
		phase < hold
			? 0
			: phase < hold + travel
				? ((phase - hold) / travel) * distance
				: phase < hold * 2 + travel
					? distance
					: distance * (1 - (phase - hold * 2 - travel) / travel)
	render(position)
	frame = requestAnimationFrame(tick)
}
const syncPlayback = () => {
	cancelAnimationFrame(frame)
	previousTime = 0
	if (
		!disposed &&
		distance > 1 &&
		visible &&
		!document.hidden &&
		!motionPreference?.matches
	)
		frame = requestAnimationFrame(tick)
}
const update = () => {
	if (disposed || !viewport.value || !track.value) return
	const nextDistance = Math.max(
		0,
		track.value.getBoundingClientRect().width - viewport.value.clientWidth,
	)
	if (Math.abs(nextDistance - distance) > 0.1) elapsed = 0
	distance = nextDistance
	if (motionPreference?.matches) {
		distance = 0
		elapsed = 0
	}
	render(0)
	syncPlayback()
}
watch(
	() => props.text,
	async () => {
		await nextTick()
		elapsed = 0
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
	cancelAnimationFrame(frame)
	resizeObserver?.disconnect()
	visibilityObserver?.disconnect()
	motionPreference?.removeEventListener('change', update)
	document.removeEventListener('visibilitychange', syncPlayback)
})
</script>

<style scoped>
.friend-title {
	mask-image: linear-gradient(
		to right,
		transparent,
		black var(--title-fade-left, 0px),
		black calc(100% - var(--title-fade-right, 0px)),
		transparent
	);
}
</style>
