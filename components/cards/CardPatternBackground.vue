<template>
	<div
		ref="background"
		class="card-pattern-background pointer-events-none absolute inset-0 text-slate-500 dark:text-slate-400"
		:data-paused="!visible || pageHidden"
		:data-focus-active="focusActive"
		:data-static="isMobileMotion"
		aria-hidden="true"
		:style="{
			'--motif-density': settings.density,
			'--motif-row-step': settings.rowStep,
			'--motif-drift-rows': tileRows,
			'--motif-transition': `${settings.transitionMs}ms`,
			'--motif-drift-duration': `${tileRows * settings.driftSecondsPerRow}s`,
			'--motif-columns': planeSize.columns,
			'--motif-rows': planeSize.rows,
		}"
	>
		<div
			v-for="active in states"
			:key="String(active)"
			class="card-pattern-background-state absolute inset-0 transition-opacity duration-(--motif-transition) ease-out motion-reduce:transition-none"
			:data-active="active"
			:data-focus-active="focusActive"
			:class="
				isMobileMotion
					? 'opacity-100'
					: active
						? 'opacity-0 group-hover/card:opacity-100 group-focus-within/card:data-[focus-active=true]:opacity-100'
						: 'opacity-100 group-hover/card:opacity-0 group-focus-within/card:data-[focus-active=true]:opacity-0'
			"
		>
			<div
				class="card-pattern-background-plane absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12"
			>
				<div class="card-pattern-background-pattern absolute inset-0">
					<svg
						:style="{
							filter: `blur(${scaledBlur(theme, active)}) saturate(1.15)`,
						}"
						:viewBox="`0 0 ${planeSize.columns} ${planeSize.rows}`"
						class="absolute inset-0 h-full w-full"
					>
						<defs>
							<filter
								:id="`${patternId}-shadow-${active}`"
								filterUnits="userSpaceOnUse"
								x="-0.18"
								y="-0.18"
								width="1.24"
								height="1.24"
								color-interpolation-filters="sRGB"
							>
								<feDropShadow
									:dx="settings.shadow.dx"
									:dy="settings.shadow.dy"
									:stdDeviation="settings.shadow.blur"
									flood-color="currentColor"
									:flood-opacity="settings.shadow.opacity"
									class="text-slate-700 dark:text-slate-950"
								/>
							</filter>
							<g
								v-for="motif in new Set(
									positions.map((position) => position.motif),
								)"
								:id="`${patternId}-material-${active}-${motifIndexKey(motif)}`"
								:key="motif"
								:style="{ opacity: motifOpacity(motif, active) }"
							>
								<slot name="motif" :motif="motif">
									<image
										:href="motif"
										width="0.88"
										height="0.88"
										preserveAspectRatio="xMidYMid meet"
									/>
								</slot>
							</g>
							<pattern
								:id="`${patternId}-${active}`"
								patternUnits="userSpaceOnUse"
								:width="tileColumns * settings.columnStep"
								:height="tileRows * settings.rowStep"
							>
								<g
									v-for="(position, motifIndex) in positions"
									:key="motifIndex"
									:transform="`translate(${position.x} ${position.y})`"
									:filter="`url(#${patternId}-shadow-${active})`"
								>
									<use
										:href="`#${patternId}-material-${active}-${motifIndexKey(position.motif)}`"
									/>
								</g>
							</pattern>
						</defs>
						<rect
							width="100%"
							height="100%"
							:fill="`url(#${patternId}-${active})`"
						/>
					</svg>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useId } from 'vue'
import { useReducedMotion } from 'motion-v'
import {
	resolveCardPatternSettings,
	calculateCardAppearance,
	CARD_PATTERN_REFERENCE_SIZE,
	CARD_APPEARANCE_SAMPLE_SIZE,
	type CardPatternOptions,
} from './cardPattern'
import type { CardAppearanceProfile } from '~/shared/types/card-appearance'

interface Props {
	focusActive?: boolean
	motifs: readonly string[]
	options?: CardPatternOptions
	profiles: Readonly<Record<string, CardAppearanceProfile>>
}

const props = withDefaults(defineProps<Props>(), {
	focusActive: true,
	options: () => ({}),
})

defineSlots<{ motif(props: { motif: string }): unknown }>()
const colorMode = useColorMode()
const hydrated = ref(false)
const theme = computed(() =>
	hydrated.value && colorMode.value === 'dark' ? 'dark' : 'light',
)
const settings = computed(() => resolveCardPatternSettings(props.options))
const blurLevels = computed(
	() =>
		Object.fromEntries(
			(['light', 'dark'] as const).map((theme) => [
				theme,
				{
					blur:
						(settings.value[theme].blur * CARD_APPEARANCE_SAMPLE_SIZE) /
						CARD_PATTERN_REFERENCE_SIZE,
					activeBlur:
						(settings.value[theme].activeBlur * CARD_APPEARANCE_SAMPLE_SIZE) /
						CARD_PATTERN_REFERENCE_SIZE,
				},
			]),
		) as Record<'light' | 'dark', { blur: number; activeBlur: number }>,
)
const scaledBlur = (theme: 'light' | 'dark', active: boolean) =>
	`calc(clamp(36px, 14cqw, 64px) / ${settings.value.density} * ${settings.value[theme][active ? 'activeBlur' : 'blur'] / CARD_PATTERN_REFERENCE_SIZE})`
const appearances = computed(() =>
	Object.fromEntries(
		props.motifs.map((motif) => [
			motif,
			Object.fromEntries(
				(['light', 'dark'] as const).map((theme) => [
					theme,
					calculateCardAppearance(
						props.profiles[motif],
						theme,
						settings.value[theme],
						blurLevels.value[theme].blur,
						blurLevels.value[theme].activeBlur,
					),
				]),
			),
		]),
	),
)
const motifOpacity = (motif: string, active: boolean) => {
	const values = appearances.value[motif]![theme.value]!
	return active ? values.activeOpacity : values.opacity
}
const motifIndexKey = (motif: string) => props.motifs.indexOf(motif)
const patternId = useId()
const background = ref<HTMLElement | null>(null)
const { isMobileMotion } = useDisplayMode()
const states = computed(() => (isMobileMotion.value ? [false] : [false, true]))
const { planeSize, tileRows, tileColumns, positions } = useCardPatternLayout({
	background,
	motifs: toRef(props, 'motifs'),
	settings,
	staticMode: isMobileMotion,
})
const visible = ref(false)
const pageHidden = ref(false)
const reducedMotion = useReducedMotion()
useCardPatternDrift({
	background,
	enabled: computed(
		() =>
			visible.value &&
			!pageHidden.value &&
			!isMobileMotion.value &&
			!reducedMotion.value,
	),
	focusActive: toRef(props, 'focusActive'),
})

let intersectionObserver: IntersectionObserver | undefined

const updatePageVisibility = () => {
	pageHidden.value = document.hidden
}

onMounted(() => {
	hydrated.value = true
	updatePageVisibility()
	document.addEventListener('visibilitychange', updatePageVisibility)
	intersectionObserver = new IntersectionObserver(([entry]) => {
		visible.value = entry?.isIntersecting ?? false
	})
	if (background.value) {
		// 可见性观察稳定的卡片盒，避免遮罩/滤镜图案的裁切影响判定。
		intersectionObserver.observe(
			background.value.closest('.group\\/card') ?? background.value,
		)
	}
})

onBeforeUnmount(() => {
	intersectionObserver?.disconnect()
	document.removeEventListener('visibilitychange', updatePageVisibility)
})
</script>

<style scoped>
.card-pattern-background-state {
	will-change: opacity;
}

.card-pattern-background {
	container-type: inline-size;
	/* 中间给前景内容留出安静区域，边缘保留素材纹理；遮罩不参与逐帧动画。 */
	mask-image: radial-gradient(
		ellipse at center,
		rgb(0 0 0 / 25%) 20%,
		rgb(0 0 0 / 60%) 65%,
		#000 100%
	);
}

/* 按卡片宽度安排约七列，宽屏单列卡片限制图案尺寸，避免素材被放大。 */
.card-pattern-background-plane {
	--motif-step: calc(clamp(36px, 14cqw, 64px) / var(--motif-density));
	width: calc(var(--motif-step) * var(--motif-columns));
	height: calc(var(--motif-step) * var(--motif-rows));
}

.card-pattern-background-pattern {
	will-change: transform;
	animation: card-pattern-background-drift var(--motif-drift-duration) linear
		infinite;
	animation-play-state: paused;
}

.card-pattern-background[data-paused='true'] .card-pattern-background-state,
.card-pattern-background[data-paused='true'] .card-pattern-background-pattern {
	will-change: auto;
}

.card-pattern-background[data-paused='true'] .card-pattern-background-pattern {
	animation-play-state: paused;
}

.card-pattern-background[data-static='true'] .card-pattern-background-state,
.card-pattern-background[data-static='true'] .card-pattern-background-pattern {
	will-change: auto;
	animation: none;
	transition: none;
}

/* hydration 之前也不在触摸/窄屏启动第二层与漂移。 */
@media (width < 64rem), (hover: none) {
	.card-pattern-background-state[data-active='true'] {
		display: none;
	}
	.card-pattern-background-state,
	.card-pattern-background-pattern {
		will-change: auto;
		animation: none;
		transition: none;
	}
}

@keyframes card-pattern-background-drift {
	from {
		transform: translate(0, 0);
	}
	to {
		transform: translateY(
			calc(var(--motif-step) * var(--motif-row-step) * var(--motif-drift-rows))
		);
	}
}

@media (prefers-reduced-motion: reduce) {
	.card-pattern-background-state {
		will-change: auto;
	}

	.card-pattern-background-pattern {
		will-change: auto;
		animation: none;
	}
}
</style>
