<template>
	<div
		ref="background"
		class="card-pattern-background pointer-events-none absolute inset-0 text-slate-500 dark:text-slate-400"
		:data-paused="!visible || pageHidden"
		:data-focus-active="focusActive"
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
			v-for="active in [false, true]"
			:key="String(active)"
			class="card-pattern-background-state absolute inset-0 transition-opacity duration-(--motif-transition) ease-out motion-reduce:transition-none"
			:data-active="active"
			:data-focus-active="focusActive"
			:class="
				active
					? 'opacity-0 group-hover/card:opacity-100 group-focus-within/card:data-[focus-active=true]:opacity-100'
					: 'opacity-100 group-hover/card:opacity-0 group-focus-within/card:data-[focus-active=true]:opacity-0'
			"
		>
			<div
				class="card-pattern-background-plane absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12"
			>
				<div class="card-pattern-background-pattern absolute inset-0">
					<svg
						v-for="(layer, index) in layers"
						:key="layer.motif"
						:data-selected="layer.motif === selectedMotif"
						:style="{
							opacity:
								hasSelection && layer.motif !== selectedMotif
									? CARD_SELECTION_DIM
									: 1,
							filter: `blur(${scaledBlur(theme, active)}) saturate(1.15)`,
						}"
						:viewBox="`0 0 ${planeSize.columns} ${planeSize.rows}`"
						class="absolute inset-0 h-full w-full"
					>
						<defs>
							<filter
								:id="`${patternId}-shadow-${active}-${index}`"
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
									layer.positions.map((position) => position.motif),
								)"
								:id="`${patternId}-material-${active}-${index}-${motifIndexKey(motif)}`"
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
								:id="`${patternId}-${active}-${index}`"
								patternUnits="userSpaceOnUse"
								:width="tileColumns * settings.columnStep"
								:height="tileRows * settings.rowStep"
							>
								<g
									v-for="(position, motifIndex) in layer.positions"
									:key="motifIndex"
									:transform="`translate(${position.x} ${position.y})`"
									:filter="`url(#${patternId}-shadow-${active}-${index})`"
								>
									<use
										:href="`#${patternId}-material-${active}-${index}-${motifIndexKey(position.motif)}`"
									/>
								</g>
							</pattern>
						</defs>
						<rect
							width="100%"
							height="100%"
							:fill="`url(#${patternId}-${active}-${index})`"
						/>
					</svg>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useId } from 'vue'
import {
	resolveCardPatternSettings,
	calculateCardAppearance,
	CARD_PATTERN_REFERENCE_SIZE,
	CARD_APPEARANCE_SAMPLE_SIZE,
	CARD_SELECTION_DIM,
	type CardPatternOptions,
} from './cardPattern'
import type { CardAppearanceProfile } from '~/shared/types/card-appearance'

interface Props {
	focusActive?: boolean
	motifs: readonly string[]
	selectedMotif?: string
	options?: CardPatternOptions
	profiles: Readonly<Record<string, CardAppearanceProfile>>
}

const props = withDefaults(defineProps<Props>(), {
	selectedMotif: '',
	focusActive: true,
	options: () => ({}),
})

defineSlots<{ motif(props: { motif: string }): unknown }>()
interface TilePosition {
	motif: string
	x: number
	y: number
}

interface MotifLayer {
	motif: string
	positions: TilePosition[]
}

const colorMode = useColorMode()
const hydrated = ref(false)
const theme = computed(() =>
	hydrated.value && colorMode.value === 'dark' ? 'dark' : 'light',
)
const planeSize = ref({ columns: 12, rows: 8 })
let resizeObserver: ResizeObserver | undefined
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
	const selected = motif === props.selectedMotif
	const values = appearances.value[motif]![theme.value]!
	return selected
		? active
			? values.activeSelectedOpacity
			: values.selectedOpacity
		: active
			? values.activeOpacity
			: values.opacity
}
const motifIndexKey = (motif: string) => props.motifs.indexOf(motif)
const patternId = useId()
const tileRows = computed(() =>
	Math.max(
		1,
		settings.value.layout === 'catalog'
			? Math.ceil(props.motifs.length / 4)
			: props.motifs.length,
	),
)
const tileColumns = computed(() =>
	settings.value.layout === 'catalog'
		? 4
		: tileRows.value % 2 === 0
			? tileRows.value
			: tileRows.value * 2,
)
// 只有选中高亮需要分层；等权素材合并为一层，避免图标增多时增加合成层。
const hasSelection = computed(() => Boolean(props.selectedMotif))
const layers = computed<MotifLayer[]>(() => {
	const motifLayers = props.motifs.map((motif, motifIndex) => {
		const positions: TilePosition[] = []
		const addPosition = (column: number, row: number) => {
			const x =
				column * settings.value.columnStep +
				(settings.value.columnStep - 0.88) / 2
			const y =
				(row + (column % 2 ? 0.5 : 0)) * settings.value.rowStep +
				(settings.value.rowStep - 0.88) / 2
			positions.push({ x, y, motif })
			if (y + 0.88 > tileRows.value * settings.value.rowStep)
				positions.push({
					x,
					y: y - tileRows.value * settings.value.rowStep,
					motif,
				})
		}
		for (let column = 0; column < tileColumns.value; column += 1) {
			if (settings.value.layout === 'catalog') {
				for (let row = 0; row < tileRows.value; row++) {
					if (
						(row * tileColumns.value + column) % props.motifs.length ===
						motifIndex
					)
						addPosition(column, row)
				}
			} else {
				const row =
					(motifIndex - (column % tileRows.value) + tileRows.value) %
					tileRows.value
				addPosition(column, row)
			}
		}
		return { motif, positions }
	})
	return hasSelection.value
		? motifLayers
		: [
				{
					motif: 'combined',
					positions: motifLayers.flatMap((layer) => layer.positions),
				},
			]
})
const background = ref<HTMLElement | null>(null)
const visible = ref(false)
const pageHidden = ref(false)
let intersectionObserver: IntersectionObserver | undefined

const updatePageVisibility = () => {
	pageHidden.value = document.hidden
}

onMounted(() => {
	hydrated.value = true
	resizeObserver = new ResizeObserver(([entry]) => {
		if (!entry) return
		const { width, height } = entry.contentRect
		const step =
			Math.max(36, Math.min(64, width * 0.14)) / settings.value.density
		const angle = Math.PI / 15
		// 移动完整平铺周期，双侧补足周期高度，循环回到起点时图案完全重合。
		planeSize.value = {
			columns: Math.ceil(
				(width * Math.cos(angle) + height * Math.sin(angle)) / step + 1,
			),
			rows: Math.ceil(
				(height * Math.cos(angle) + width * Math.sin(angle)) / step +
					2 * tileRows.value * settings.value.rowStep +
					1,
			),
		}
	})
	if (background.value) resizeObserver.observe(background.value)
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
	resizeObserver?.disconnect()
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

@media (hover: hover) {
	:global(.group\/card:hover .card-pattern-background-pattern),
	:global(
		.group\/card:focus-within
			.card-pattern-background[data-focus-active='true']
			.card-pattern-background-pattern
	) {
		animation-play-state: running;
	}
}

.card-pattern-background[data-paused='true'] .card-pattern-background-state,
.card-pattern-background[data-paused='true'] .card-pattern-background-pattern {
	will-change: auto;
}

.card-pattern-background[data-paused='true'] .card-pattern-background-pattern {
	animation-play-state: paused;
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
