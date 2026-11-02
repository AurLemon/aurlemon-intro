<template>
	<span ref="viewport" class="friend-title block min-w-0 overflow-hidden">
		<span ref="track" class="block w-max whitespace-pre pr-3">{{ text }}</span>
	</span>
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
const returnDuration = 420
const render = (position: number) => {
	if (!viewport.value || !track.value) return
	track.value.style.transform = `translateX(-${position}px)`
	viewport.value.style.setProperty(
		'--title-fade-left',
		`${position > 0.5 ? 12 : 0}px`,
	)
	viewport.value.style.setProperty(
		'--title-fade-right',
		`${distance - position > 0.5 ? 12 : 0}px`,
	)
}
const tick = (time: number) => {
	if (previousTime) elapsed += time - previousTime
	previousTime = time
	const travel = (distance / speed) * 1000
	const phase = elapsed % (hold * 2 + travel + returnDuration)
	const position =
		phase < hold
			? 0
			: phase < hold + returnDuration
				? ((phase - hold) / returnDuration) * distance
				: phase < hold * 2 + returnDuration
					? distance
					: distance * (1 - ((phase - hold * 2 - returnDuration) / travel) ** 2)
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
	--title-fade-left: 0px;
	--title-fade-right: 0px;
	mask-image: linear-gradient(
		to right,
		transparent 0,
		black var(--title-fade-left),
		black calc(100% - var(--title-fade-right)),
		transparent 100%
	);
	-webkit-mask-image: linear-gradient(
		to right,
		transparent 0,
		black var(--title-fade-left),
		black calc(100% - var(--title-fade-right)),
		transparent 100%
	);
	transition:
		--title-fade-left 100ms ease-out,
		--title-fade-right 100ms ease-out;
}

@property --title-fade-left {
	syntax: '<length>';
	inherits: false;
	initial-value: 0px;
}
@property --title-fade-right {
	syntax: '<length>';
	inherits: false;
	initial-value: 0px;
}

@media (prefers-reduced-motion: reduce) {
	.friend-title {
		transition: none;
	}
}
</style>
