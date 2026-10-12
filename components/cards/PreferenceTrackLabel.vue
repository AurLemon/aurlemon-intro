<template>
	<span
		ref="viewport"
		class="relative block h-4 min-w-0 max-w-[min(55%,14rem)] overflow-hidden transition-[width] duration-400 ease-in-out motion-reduce:transition-none font-semibold text-slate-600 dark:text-slate-300"
		:class="{ 'preference-track-edge-mask': hasOverflow && !reducedMotion }"
		:style="{ width: labelWidth === null ? 'max-content' : `${labelWidth}px` }"
		:title="label"
		:aria-label="label"
	>
		<span
			ref="measure"
			class="invisible absolute w-max whitespace-nowrap"
			aria-hidden="true"
			>{{ label }}</span
		>
		<Transition
			name="preference-label"
			mode="out-in"
			@before-leave="freezeTrack"
		>
			<span
				ref="track"
				:key="contentKey ?? label"
				class="block w-max min-w-full whitespace-nowrap text-center"
				:class="{
					'px-3': hasOverflow && !reducedMotion,
					truncate: reducedMotion,
				}"
				aria-hidden="true"
				>{{ label }}</span
			>
		</Transition>
	</span>
</template>

<script setup lang="ts">
interface Props {
	label: string
	contentKey?: string
	pixelsPerSecond?: number
}
interface LabelMeasurements {
	label: string
	textWidth: number
	parentWidth: number
	rem: number
}
const props = withDefaults(defineProps<Props>(), {
	contentKey: undefined,
	pixelsPerSecond: 56,
})
const emit = defineEmits<{ readWindow: [duration: number] }>()
const viewport = ref<HTMLElement | null>(null)
const measure = ref<HTMLElement | null>(null)
const track = ref<HTMLElement | null>(null)
const labelWidth = ref<number | null>(null)
const hasOverflow = ref(false)
const reducedMotion = ref(false)
let animation: Animation | undefined
let resizeObserver: ResizeObserver | undefined
let motionPreference: MediaQueryList | undefined
let previousLayout = ''
let previousTrack: HTMLElement | null = null
let revision = 0
let mounted = false
const measurements: LabelMeasurements = {
	label: '',
	textWidth: 0,
	parentWidth: 0,
	rem: 0,
}

const restart = async () => {
	await nextTick()
	if (!mounted || !viewport.value || !measure.value) return
	if (measurements.label !== props.label || measurements.parentWidth <= 0)
		return
	const { textWidth, parentWidth, rem } = measurements
	labelWidth.value = Math.min(textWidth, parentWidth * 0.55, rem * 14)
	// 滚动使用最终宽度，不跟随外层 width 过渡的中间帧反复重建。
	const width = labelWidth.value
	const currentTrack = track.value
	if (
		!currentTrack ||
		currentTrack.classList.contains('preference-label-leave-active') ||
		currentTrack.textContent !== props.label
	)
		return
	const layout = `${props.contentKey}:${props.label}:${width}:${textWidth}:${props.pixelsPerSecond}:${reducedMotion.value}`
	if (layout === previousLayout && currentTrack === previousTrack) return
	// 相同尺寸的通知不能使正在等待 DOM 更新的初始化失效。
	const currentRevision = ++revision
	previousLayout = layout
	previousTrack = currentTrack
	animation?.cancel()
	animation = undefined
	hasOverflow.value = textWidth > width + 1
	if (reducedMotion.value || !hasOverflow.value) emit('readWindow', 0)
	await nextTick()
	if (
		!mounted ||
		currentRevision !== revision ||
		track.value !== currentTrack ||
		reducedMotion.value ||
		!hasOverflow.value
	)
		return
	const distance = Math.max(0, textWidth + 24 - width)
	// 入场结束后先读开头，再以固定速度滚动；长标题延长换图窗口，不加速赶场。
	const hold = 1500
	const travel = (distance / props.pixelsPerSecond) * 1000
	const duration = hold + travel + 1000
	emit('readWindow', duration + 400)
	const end = `translateX(-${distance}px)`
	animation = currentTrack.animate(
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
const freezeTrack = (element: Element) => {
	if (element instanceof HTMLElement)
		element.style.transform = getComputedStyle(element).transform
	animation?.cancel()
	animation = undefined
	previousLayout = ''
	previousTrack = null
	revision++
}
const measureText = async () => {
	await nextTick()
	if (!mounted || !measure.value) return
	measurements.label = props.label
	measurements.textWidth = Math.ceil(
		measure.value.getBoundingClientRect().width,
	)
	void restart()
}
const onFontsLoaded = () => {
	measurements.rem = parseFloat(
		getComputedStyle(document.documentElement).fontSize,
	)
	void measureText()
}
watch(() => props.label, measureText)
watch([() => props.contentKey, () => props.pixelsPerSecond], restart)
watch(track, restart)
onMounted(() => {
	mounted = true
	motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
	motionPreference.addEventListener('change', onMotionChange)
	onMotionChange()
	measurements.rem = parseFloat(
		getComputedStyle(document.documentElement).fontSize,
	)
	resizeObserver = new ResizeObserver((entries) => {
		for (const entry of entries) {
			if (entry.target === measure.value) {
				measurements.label = props.label
				measurements.textWidth = Math.ceil(entry.contentRect.width)
			} else {
				measurements.parentWidth = entry.contentRect.width
				measurements.rem = parseFloat(
					getComputedStyle(document.documentElement).fontSize,
				)
			}
		}
		void restart()
	})
	resizeObserver.observe(measure.value!)
	if (viewport.value?.parentElement)
		resizeObserver.observe(viewport.value.parentElement)
	document.fonts.addEventListener('loadingdone', onFontsLoaded)
	document.addEventListener('visibilitychange', syncPlayback)
})
onBeforeUnmount(() => {
	mounted = false
	revision++
	// 保留离场时的当前位置，避免 opacity 退场期间跳回文本开头。
	if (animation && track.value)
		track.value.style.transform = getComputedStyle(track.value).transform
	animation?.cancel()
	resizeObserver?.disconnect()
	motionPreference?.removeEventListener('change', onMotionChange)
	document.fonts.removeEventListener('loadingdone', onFontsLoaded)
	document.removeEventListener('visibilitychange', syncPlayback)
})
</script>

<style scoped>
.preference-label-enter-active {
	transition: opacity 240ms ease-out;
}
.preference-label-leave-active {
	transition: opacity 160ms ease-in;
}
.preference-label-enter-from,
.preference-label-leave-to {
	opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
	.preference-label-enter-active,
	.preference-label-leave-active {
		transition: none;
	}
}

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
