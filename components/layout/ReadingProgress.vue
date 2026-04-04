<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'

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
			<!-- 百分比数字 -->
			<span
				class="text-lg font-medium text-slate-800 dark:text-slate-300 w-8 tracking-wide"
			>
				{{ progress }}%
			</span>
		</div>
	</ClientOnly>
</template>
