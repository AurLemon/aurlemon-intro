<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'

const props = withDefaults(
	defineProps<{
		/**
		 * 目标容器的选择器或 ID，例如 '#article-container' 或 '.main-content'。
		 * 推荐使用 targetSelector 而非 Ref<HTMLElement> 是因为在 Nuxt 中，
		 * Header 和 PageContainer 可能不在同一作用域下，使用选择器解除组件耦合度更利于通用。
		 */
		targetSelector?: string
	}>(),
	{
		targetSelector: '#article-container', // 默认值
	},
)

const progress = ref(0)
const progressMeasureRef = ref<HTMLElement | null>(null)
const progressTextWidth = ref<number | null>(null)

let targetElement: HTMLElement | null = null
let animationFrameId: number | null = null

const calculateProgress = () => {
	if (!targetElement) return

	const containerTopAbsolute =
		targetElement.getBoundingClientRect().top + window.scrollY
	const containerBottomAbsolute =
		containerTopAbsolute + targetElement.offsetHeight
	const start = containerTopAbsolute
	const end = containerBottomAbsolute - window.innerHeight
	const viewportHeight = window.innerHeight
	const containerRect = targetElement.getBoundingClientRect()

	// Handle the edge case where container is smaller than viewport
	if (end <= start) {
		// 如果内容整体能被视口完整包住，就直接视为 100%
		progress.value =
			containerRect.top >= 0 && containerRect.bottom <= viewportHeight ? 100 : 0
		return
	}

	if (window.scrollY <= start) {
		progress.value = 0
	} else if (window.scrollY >= end) {
		progress.value = 100
	} else {
		progress.value = ((window.scrollY - start) / (end - start)) * 100
	}

	// 限制在 0-100 范围，并保留整数
	progress.value = Math.max(0, Math.min(100, Math.floor(progress.value)))
}

const onScroll = () => {
	if (animationFrameId !== null) {
		cancelAnimationFrame(animationFrameId)
	}
	animationFrameId = requestAnimationFrame(calculateProgress)
}

const initializeTarget = () => {
	if (!import.meta.client) return

	targetElement = document.querySelector<HTMLElement>(props.targetSelector)

	if (targetElement) {
		calculateProgress() // 初始化计算
	} else {
		progress.value = 0
	}
}

let observer: MutationObserver | null = null

watch(
	() => props.targetSelector,
	() => {
		if (!import.meta.client) return
		initializeTarget()
	},
)

onMounted(() => {
	initializeTarget()

	// 监听滚动与窗口大小调整
	window.addEventListener('scroll', onScroll, { passive: true })
	window.addEventListener('resize', onScroll, { passive: true })

	// 可选增强：监听 DOM 变化以重新绑定目标（如果目标在异步加载后出现）
	observer = new MutationObserver(() => {
		if (!targetElement || !document.contains(targetElement)) {
			targetElement = null
			initializeTarget()
		} else {
			// 如果目标元素发生高宽变化，可触发计算
			onScroll()
		}
	})
	observer.observe(document.body, { childList: true, subtree: true })
})

onUnmounted(() => {
	if (!import.meta.client) return

	if (animationFrameId !== null) {
		cancelAnimationFrame(animationFrameId)
	}

	window.removeEventListener('scroll', onScroll)
	window.removeEventListener('resize', onScroll)

	if (observer) {
		observer.disconnect()
	}
})

// 计算 SVG 环形进度
const circleRadius = 10
const circleCircumference = 2 * Math.PI * circleRadius
const digitCharacters = Array.from({ length: 10 }, (_, index) => `${index}`)
const digitStepEm = 1.2
const progressText = computed(() => `${progress.value}%`)
const progressDigits = computed(() => String(progress.value).split(''))

const updateProgressTextWidth = async (): Promise<void> => {
	await nextTick()

	const width = progressMeasureRef.value?.getBoundingClientRect().width

	if (!width) {
		return
	}

	progressTextWidth.value = Math.ceil(width)
}

watch(progressText, () => {
	void updateProgressTextWidth()
})

onMounted(() => {
	void updateProgressTextWidth()
})
</script>

<template>
	<ClientOnly>
		<!-- 阅读进度展示 -->
		<div class="flex items-center gap-0.5">
			<div
				class="relative w-6 h-6 flex items-center justify-center text-primary-500"
			>
				<!-- 背景圆环 -->
				<svg
					class="absolute inset-0 w-full h-full -rotate-90"
					viewBox="0 0 36 36"
				>
					<circle
						cx="18"
						cy="18"
						:r="circleRadius"
						class="stroke-slate-300 dark:stroke-slate-600"
						stroke-width="3"
						fill="none"
					/>
					<!-- 进度前景圆环 -->
					<circle
						cx="18"
						cy="18"
						:r="circleRadius"
						class="stroke-current transition-all duration-150 ease-out"
						stroke-width="3"
						fill="none"
						stroke-linecap="round"
						:stroke-dasharray="circleCircumference"
						:stroke-dashoffset="
							circleCircumference - (progress / 100) * circleCircumference
						"
					/>
				</svg>
			</div>
			<span
				class="progress-text overflow-hidden text-lg leading-none font-medium tracking-wide text-slate-800 transition-[width] duration-220 ease-out dark:text-slate-300"
				:style="
					progressTextWidth === null
						? undefined
						: { width: `${progressTextWidth}px` }
				"
			>
				<span class="progress-text__inner" :aria-label="progressText">
					<span
						v-for="(digit, index) in progressDigits"
						:key="`${progressDigits.length}-${index}`"
						class="digit-flip"
						aria-hidden="true"
					>
						<span
							class="digit-flip__reel transition-transform duration-150 ease-out"
							:style="{
								transform: `translate3d(0, -${Number(digit) * digitStepEm}em, 0)`,
							}"
						>
							<span
								v-for="digitCharacter in digitCharacters"
								:key="digitCharacter"
								class="digit-flip__digit"
							>
								{{ digitCharacter }}
							</span>
						</span>
					</span>
					<span class="progress-percent" aria-hidden="true">%</span>
				</span>
			</span>
			<span
				ref="progressMeasureRef"
				class="progress-text pointer-events-none fixed top-0 left-0 -z-10 opacity-0 text-lg leading-none font-medium tracking-wide"
				aria-hidden="true"
			>
				<span class="progress-text__inner">
					<span
						v-for="(digit, index) in progressDigits"
						:key="`measure-${progressDigits.length}-${index}`"
						class="digit-flip"
					>
						{{ digit }}
					</span>
					<span class="progress-percent">%</span>
				</span>
			</span>
		</div>
	</ClientOnly>
</template>

<style scoped>
.digit-flip {
	display: inline-block;
	width: 0.62em;
	height: 1.2em;
	overflow: hidden;
	overflow: clip;
	clip-path: inset(0);
	contain: paint;
	line-height: 1.2em;
	text-align: center;
	font-variant-numeric: tabular-nums;
	vertical-align: -0.16em;
}

.digit-flip__reel {
	display: flex;
	flex-direction: column;
	line-height: 1.2em;
	will-change: transform;
}

.digit-flip__digit {
	display: block;
	width: 100%;
	height: 1.2em;
	line-height: 1.2em;
	text-align: center;
}

.progress-text {
	line-height: 1;
	font-variant-numeric: tabular-nums;
	font-feature-settings: 'tnum';
}

.progress-text__inner {
	display: inline-block;
	width: max-content;
	height: 1.2em;
	line-height: 1.2em;
	transform: translateY(-0.12em);
	white-space: nowrap;
}

.progress-percent {
	display: inline-block;
	height: 1.2em;
	line-height: 1.2em;
	vertical-align: -0.16em;
}
</style>
