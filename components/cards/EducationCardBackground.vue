<template>
	<div
		ref="background"
		class="education-background absolute inset-0 blur-[2.5px] saturate-[0.65] transition-[filter] duration-500 group-hover/card:blur-[1.5px] group-focus-within/card:blur-[1.5px]"
		:data-paused="!visible || pageHidden"
	>
		<div
			class="education-background-plane absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12"
		>
			<div class="education-background-pattern grid h-full grid-cols-20">
				<div
					v-for="(badge, index) in pattern"
					:key="index"
					class="education-background-cell flex items-center justify-center"
					:class="{
						'education-background-cell-offset': Math.floor(index / 20) % 2,
					}"
				>
					<img
						:src="badge"
						alt=""
						width="64"
						height="64"
						class="block aspect-square h-auto w-[88%] select-none object-contain transition-opacity duration-500 motion-reduce:transition-none"
						:class="
							badge === selectedBadge
								? 'opacity-[0.12] group-hover/card:opacity-[0.20] group-focus-within/card:opacity-[0.20]'
								: 'opacity-[0.06] group-hover/card:opacity-[0.11] group-focus-within/card:opacity-[0.11]'
						"
						draggable="false"
					/>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

interface Props {
	badges: readonly string[]
	selectedBadge: string
}

const props = defineProps<Props>()
// 固定排列复用现有资源，避免随机构图引起 SSR 水合差异。
const pattern = computed(() =>
	Array.from({ length: 160 }, (_, index) => {
		const row = Math.floor(index / 20)
		return props.badges[(index + row) % props.badges.length]
	}),
)
const background = ref<HTMLElement | null>(null)
const visible = ref(false)
const pageHidden = ref(false)
let intersectionObserver: IntersectionObserver | undefined

const updatePageVisibility = () => {
	pageHidden.value = document.hidden
}

onMounted(() => {
	updatePageVisibility()
	document.addEventListener('visibilitychange', updatePageVisibility)
	intersectionObserver = new IntersectionObserver(([entry]) => {
		visible.value = entry?.isIntersecting ?? false
	})
	if (background.value) intersectionObserver.observe(background.value)
})

onBeforeUnmount(() => {
	intersectionObserver?.disconnect()
	document.removeEventListener('visibilitychange', updatePageVisibility)
})
</script>

<style scoped>
.education-background {
	container-type: inline-size;
	/* 中间给校名留出安静区域，边缘保留校徽纹理；遮罩不参与逐帧动画。 */
	mask-image: radial-gradient(
		ellipse at center,
		rgb(0 0 0 / 25%) 20%,
		rgb(0 0 0 / 60%) 65%,
		#000 100%
	);
}

/* 按卡片宽度安排约七列，宽屏单列卡片限制图案尺寸，避免校徽被放大。 */
.education-background-plane {
	--badge-step: clamp(36px, 14cqw, 64px);
	width: calc(var(--badge-step) * 20);
	height: calc(var(--badge-step) * 8);
}

.education-background-cell {
	height: var(--badge-step);
}

.education-background-cell-offset {
	translate: calc(var(--badge-step) / 2) 0;
}

.education-background-pattern {
	animation: education-background-drift 10s linear infinite alternate;
	animation-play-state: paused;
}

@media (hover: hover) {
	:global(.group\/card:hover .education-background-pattern),
	:global(.group\/card:focus-within .education-background-pattern) {
		animation-play-state: running;
	}
}

.education-background[data-paused='true'] .education-background-pattern {
	animation-play-state: paused;
}

@keyframes education-background-drift {
	from {
		transform: translate(0, 0);
	}
	to {
		transform: translateX(calc(var(--badge-step) * -2));
	}
}

@media (prefers-reduced-motion: reduce) {
	.education-background {
		transition: none;
	}

	.education-background-pattern {
		animation: none;
	}
}
</style>
