<template>
	<span
		ref="viewport"
		class="relative block h-4 w-max min-w-0 max-w-[min(55%,14rem)] overflow-hidden font-semibold text-slate-600 dark:text-slate-300"
		:class="{ 'preference-track-edge-mask': hasOverflow && !reducedMotion }"
		:title="label"
		:aria-label="label"
	>
		<span
			ref="measure"
			class="invisible absolute w-max whitespace-nowrap"
			aria-hidden="true"
			>{{ label }}</span
		>
		<span
			ref="track"
			class="block w-max min-w-full whitespace-nowrap text-center"
			:class="{
				'px-3': hasOverflow && !reducedMotion,
				truncate: reducedMotion,
			}"
			aria-hidden="true"
			>{{ label }}</span
		>
	</span>
</template>

<script setup lang="ts">
interface Props {
	label: string
}
const props = defineProps<Props>()
const emit = defineEmits<{ readWindow: [duration: number] }>()
const viewport = ref<HTMLElement | null>(null)
const measure = ref<HTMLElement | null>(null)
const track = ref<HTMLElement | null>(null)
const hasOverflow = ref(false)
const reducedMotion = ref(false)
let animation: Animation | undefined
let resizeObserver: ResizeObserver | undefined
let motionPreference: MediaQueryList | undefined
let previousLayout = ''
let revision = 0
let mounted = false

const restart = async () => {
	const currentRevision = ++revision
	await nextTick()
	if (
		!mounted ||
		currentRevision !== revision ||
		!viewport.value ||
		!measure.value ||
		!track.value
	)
		return
	const width = viewport.value.clientWidth
	const textWidth = Math.ceil(measure.value.getBoundingClientRect().width)
	const layout = `${props.label}:${width}:${textWidth}:${reducedMotion.value}`
	if (layout === previousLayout) return
	previousLayout = layout
	animation?.cancel()
	animation = undefined
	hasOverflow.value = textWidth > width + 1
	if (reducedMotion.value || !hasOverflow.value) emit('readWindow', 0)
	await nextTick()
	if (
		!mounted ||
		currentRevision !== revision ||
		!track.value ||
		reducedMotion.value ||
		!hasOverflow.value
	)
		return
	const distance = Math.max(0, textWidth + 24 - width)
	// 入场结束后先读开头，再以固定速度滚动；长标题延长换图窗口，不加速赶场。
	const hold = 3500
	const travel = (distance / 32) * 1000
	const duration = hold + travel + 2000
	emit('readWindow', duration + 400)
	const end = `translateX(-${distance}px)`
	animation = track.value.animate(
		[
			{ offset: 0, transform: 'translateX(0)' },
			{ offset: hold / duration, transform: 'translateX(0)' },
			{ offset: (hold + travel) / duration, transform: end },
			{ offset: 1, transform: end },
		],
		{ duration, iterations: 1, fill: 'forwards', easing: 'linear' },
	)
	syncPlayback()
}
const syncPlayback = () => {
	if (document.hidden) animation?.pause()
	else if (animation?.playState === 'paused') animation.play()
}
const onMotionChange = () => {
	reducedMotion.value = motionPreference?.matches ?? false
	void restart()
}
watch(() => props.label, restart)
onMounted(() => {
	mounted = true
	motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
	motionPreference.addEventListener('change', onMotionChange)
	onMotionChange()
	resizeObserver = new ResizeObserver(() => void restart())
	resizeObserver.observe(viewport.value!)
	resizeObserver.observe(measure.value!)
	document.fonts.addEventListener('loadingdone', restart)
	document.addEventListener('visibilitychange', syncPlayback)
})
onBeforeUnmount(() => {
	mounted = false
	revision++
	// 保留离场时的当前位置，避免 opacity/blur 退场期间跳回文本开头。
	if (animation && track.value)
		track.value.style.transform = getComputedStyle(track.value).transform
	animation?.cancel()
	resizeObserver?.disconnect()
	motionPreference?.removeEventListener('change', onMotionChange)
	document.fonts.removeEventListener('loadingdone', restart)
	document.removeEventListener('visibilitychange', syncPlayback)
})
</script>

<style scoped>
.preference-track-edge-mask {
	mask-image: linear-gradient(
		to right,
		transparent,
		black 12px,
		black calc(100% - 12px),
		transparent
	);
}
</style>
