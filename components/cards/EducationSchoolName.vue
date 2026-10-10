<template>
	<div
		ref="viewport"
		class="relative block h-[1.3em] w-full overflow-hidden"
		:class="{ 'overflow-x-auto': reducedMotion }"
		:aria-label="fullName"
		:title="fullName"
		:tabindex="hasOverflow ? 0 : undefined"
		@mouseenter="paused = true"
		@mouseleave="paused = false"
		@focus="paused = true"
		@blur="paused = false"
	>
		<span
			ref="fullMeasure"
			class="pointer-events-none invisible absolute w-max whitespace-nowrap"
			aria-hidden="true"
			>{{ fullName }}</span
		>
		<span
			ref="shortMeasure"
			class="pointer-events-none invisible absolute w-max whitespace-nowrap"
			aria-hidden="true"
			>{{ shortName }}</span
		>
		<span
			v-if="usesShortName"
			ref="shortText"
			class="absolute inset-0 flex items-start justify-center"
			aria-hidden="true"
		>
			<span class="min-w-0 truncate">{{ shortName }}</span>
		</span>
		<div
			class="h-full w-full"
			:class="{ 'school-name-edge-mask': hasOverflow && !reducedMotion }"
		>
			<span
				ref="fullText"
				class="block w-max min-w-full whitespace-nowrap text-center"
				:class="{
					'opacity-0': usesShortName,
					'px-6': hasOverflow && !reducedMotion,
				}"
				aria-hidden="true"
				>{{ fullName }}</span
			>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

interface Props {
	fullName: string
	shortName?: string
	layoutTarget?: HTMLElement | null
	logoTarget?: HTMLElement | null
	availableWidth?: number
	minimumWidth?: number
}

const props = withDefaults(defineProps<Props>(), {
	shortName: '',
	layoutTarget: null,
	logoTarget: null,
	availableWidth: 0,
	minimumWidth: 0,
})
const viewport = ref<HTMLElement | null>(null)
const fullText = ref<HTMLElement | null>(null)
const shortText = ref<HTMLElement | null>(null)
const fullMeasure = ref<HTMLElement | null>(null)
const shortMeasure = ref<HTMLElement | null>(null)
const hasOverflow = ref(Boolean(props.shortName))
const reducedMotion = ref(false)
const paused = ref(false)
const visible = ref(true)
const pageHidden = ref(false)
const usesShortName = computed(
	() => Boolean(props.shortName) && hasOverflow.value && !reducedMotion.value,
)

// 简称多停留一会儿；全称两端留出阅读时间，按固定像素速度线性展示。
const SHORT_HOLD = 3000
const FULL_HOLD = 1200
const FADE = 360
const PIXELS_PER_SECOND = 56
const EDGE_PADDING = 48
let animations: Animation[] = []
let resizeObserver: ResizeObserver | undefined
let intersectionObserver: IntersectionObserver | undefined
let motionPreference: MediaQueryList | undefined
let mounted = false
let revision = 0

interface AnimationLayout {
	fullName: string
	shortName: string
	availableWidth: number
	fullTextWidth: number
	compactWidth: number
	fullWidth: number
	reducedMotion: boolean
	layoutTarget: HTMLElement | null
	logoTarget: HTMLElement | null
}

let previousLayout: AnimationLayout | undefined

const cancelAnimations = () => {
	animations.forEach((animation) => animation.cancel())
	animations = []
}

const freezeAnimationFrame = () => {
	// Vue 的离场过渡会保留 DOM，但子组件已经开始卸载。
	// 先把当前动画帧写回旧元素，再撤掉动画，避免校徽和文字在退出时跳回原位。
	animations.forEach((animation) => {
		const effect = animation.effect
		if (
			!(effect instanceof KeyframeEffect) ||
			!(effect.target instanceof HTMLElement)
		)
			return
		animation.pause()
		const target = effect.target
		const computedStyle = getComputedStyle(target)
		const keyframes = effect.getKeyframes()
		for (const property of ['opacity', 'transform']) {
			if (keyframes.some((keyframe) => property in keyframe))
				target.style.setProperty(
					property,
					computedStyle.getPropertyValue(property),
				)
		}
	})
}

const syncPlayback = () => {
	animations.forEach((animation) => {
		if (paused.value || !visible.value || pageHidden.value) animation.pause()
		else animation.play()
	})
}

const restart = async () => {
	const currentRevision = ++revision
	await nextTick()
	if (
		!mounted ||
		currentRevision !== revision ||
		!viewport.value ||
		!fullText.value ||
		!fullMeasure.value
	)
		return

	// 测量原始文字与卡片可用空间，不把正在变化的列宽当作溢出判断依据。
	const availableWidth = props.availableWidth || viewport.value.clientWidth
	const fullTextWidth = Math.ceil(
		fullMeasure.value.getBoundingClientRect().width,
	)
	hasOverflow.value = fullTextWidth - availableWidth > 1
	const fullWidth = Math.min(
		availableWidth,
		Math.max(fullTextWidth, props.minimumWidth),
	)
	const compactWidth = Math.min(
		availableWidth,
		// 精确测量后留 2px，避免末尾字母误触发省略号。
		Math.max(
			Math.ceil(shortMeasure.value?.getBoundingClientRect().width ?? 0) + 2,
			props.minimumWidth,
		),
	)
	const layout: AnimationLayout = {
		fullName: props.fullName,
		shortName: props.shortName,
		availableWidth,
		fullTextWidth,
		compactWidth,
		fullWidth,
		reducedMotion: reducedMotion.value,
		layoutTarget: props.layoutTarget,
		logoTarget: props.logoTarget,
	}
	// 无关字体加载或重复尺寸通知不应把正在播放的动画拉回起点。
	const previous = previousLayout
	if (
		previous &&
		(Object.keys(layout) as (keyof AnimationLayout)[]).every(
			(key) => layout[key] === previous[key],
		)
	)
		return
	await nextTick()
	if (!mounted || currentRevision !== revision) return
	// 测量期间保留现有布局，准备就绪后同一帧替换动画，避免先恢复自然宽度再收拢。
	cancelAnimations()
	previousLayout = layout
	// 列宽只在测量结果改变时更新。居中 flex 中，列宽变化前后文字中心不变，
	// 校徽的位置差可以用 transform 表达，无需每帧重新布局。
	const layoutTarget = props.layoutTarget
	const logoTarget = props.logoTarget
	if (layoutTarget) layoutTarget.style.width = `${fullWidth}px`
	if (logoTarget) logoTarget.style.transform = ''
	if (reducedMotion.value || !hasOverflow.value) {
		return
	}
	const distance = Math.max(0, fullTextWidth + EDGE_PADDING - fullWidth)

	const travel = (distance / PIXELS_PER_SECOND) * 1000
	const start = usesShortName.value ? SHORT_HOLD + FADE : 0
	const scrollStart = start + FULL_HOLD
	const scrollEnd = scrollStart + travel
	const fadeStart = scrollEnd + FULL_HOLD
	const fadeEnd = fadeStart + FADE
	const duration = fadeEnd + (usesShortName.value ? 0 : FADE)
	const offset = (time: number) => time / duration
	const endTransform = `translateX(-${distance}px)`
	const fullOpacity = usesShortName.value ? 0 : 1
	const compactOffset = usesShortName.value ? (fullWidth - compactWidth) / 2 : 0
	const compactTransform = `translateX(${compactOffset}px)`
	if (props.logoTarget) {
		animations.push(
			props.logoTarget.animate(
				[
					{ offset: 0, transform: compactTransform },
					{
						offset: offset(usesShortName.value ? SHORT_HOLD : 0),
						transform: compactTransform,
						easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
					},
					{ offset: offset(start), transform: 'translateX(0)' },
					{
						offset: offset(fadeStart),
						transform: 'translateX(0)',
						easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
					},
					{ offset: 1, transform: compactTransform },
				],
				{ duration, iterations: Infinity, easing: 'linear' },
			),
		)
	}
	animations.push(
		fullText.value!.animate(
			[
				{ offset: 0, opacity: fullOpacity, transform: compactTransform },
				{
					offset: offset(usesShortName.value ? SHORT_HOLD : 0),
					opacity: fullOpacity,
					transform: compactTransform,
					easing: 'ease-in-out',
				},
				{ offset: offset(start), opacity: 1, transform: 'translateX(0)' },
				{ offset: offset(scrollStart), opacity: 1, transform: 'translateX(0)' },
				{ offset: offset(scrollEnd), opacity: 1, transform: endTransform },
				{
					offset: offset(fadeStart),
					opacity: 1,
					transform: endTransform,
					easing: 'ease-in-out',
				},
				{
					offset: offset(fadeEnd),
					opacity: 0,
					transform: `translateX(${compactOffset - distance}px)`,
				},
				...(usesShortName.value
					? []
					: [
							{
								offset: offset(fadeEnd),
								opacity: 0,
								transform: 'translateX(0)',
								easing: 'ease-in-out',
							},
							{ offset: 1, opacity: 1, transform: 'translateX(0)' },
						]),
			],
			{ duration, iterations: Infinity, easing: 'linear' },
		),
	)

	if (usesShortName.value && shortText.value) {
		animations.push(
			shortText.value.animate(
				[
					{ offset: 0, opacity: 1 },
					{ offset: offset(SHORT_HOLD), opacity: 1, easing: 'ease-in-out' },
					{ offset: offset(start), opacity: 0 },
					{ offset: offset(fadeStart), opacity: 0, easing: 'ease-in-out' },
					{ offset: 1, opacity: 1 },
				],
				{ duration, iterations: Infinity, easing: 'linear' },
			),
		)
	}
	syncPlayback()
}

const onMotionChange = () => {
	reducedMotion.value = motionPreference?.matches ?? false
	void restart()
}
const onVisibilityChange = () => {
	pageHidden.value = document.hidden
}

watch(
	() => [
		props.fullName,
		props.shortName,
		props.layoutTarget,
		props.logoTarget,
		props.availableWidth,
		props.minimumWidth,
	],
	restart,
)
watch([paused, visible, pageHidden], syncPlayback)

onMounted(() => {
	mounted = true
	motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
	motionPreference.addEventListener('change', onMotionChange)
	onMotionChange()
	onVisibilityChange()
	document.addEventListener('visibilitychange', onVisibilityChange)
	document.fonts.addEventListener('loadingdone', restart)
	resizeObserver = new ResizeObserver(() => {
		void restart()
	})
	resizeObserver.observe(fullMeasure.value!)
	resizeObserver.observe(shortMeasure.value!)
	intersectionObserver = new IntersectionObserver(([entry]) => {
		visible.value = entry?.isIntersecting ?? false
	})
	intersectionObserver.observe(viewport.value!)
})

onBeforeUnmount(() => {
	mounted = false
	revision++
	freezeAnimationFrame()
	cancelAnimations()
	resizeObserver?.disconnect()
	intersectionObserver?.disconnect()
	motionPreference?.removeEventListener('change', onMotionChange)
	document.removeEventListener('visibilitychange', onVisibilityChange)
	document.fonts.removeEventListener('loadingdone', restart)
})
</script>

<style scoped>
.school-name-edge-mask {
	mask-image: linear-gradient(
		to right,
		transparent,
		black 24px,
		black calc(100% - 24px),
		transparent
	);
}
</style>
