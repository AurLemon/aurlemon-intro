<template>
	<div class="pointer-events-none absolute inset-0" aria-hidden="true">
		<svg class="absolute h-0 w-0 overflow-hidden">
			<defs>
				<clipPath
					v-for="region in atlas.regions"
					:id="`${clipId}-${region.id}`"
					:key="region.id"
				>
					<rect
						:width="region.width"
						:height="region.height"
						:rx="region.width * 0.12"
					/>
				</clipPath>
			</defs>
		</svg>
		<CardPatternBackground
			:motifs="motifs"
			:options="patternOptions"
			:profiles="profiles"
		>
			<template #motif="{ motif }">
				<svg
					:x="(0.88 - motifSize(motif).width) / 2"
					:y="(0.88 - motifSize(motif).height) / 2"
					:width="motifSize(motif).width"
					:height="motifSize(motif).height"
					:viewBox="`0 0 ${regions[motif]!.width} ${regions[motif]!.height}`"
				>
					<image
						:href="atlas.url"
						:x="-regions[motif]!.x"
						:y="-regions[motif]!.y"
						:width="atlas.width"
						:height="atlas.height"
						:clip-path="`url(#${clipId}-${motif})`"
						preserveAspectRatio="xMidYMid slice"
					/>
				</svg>
			</template>
		</CardPatternBackground>
	</div>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'
import type { CardImageAtlas } from '~/shared/types/card-image-atlas'
import type { CardPatternOptions } from './cardPattern'
import CardPatternBackground from './CardPatternBackground.vue'

interface Props {
	atlas: CardImageAtlas
	imageWidth?: number
	options?: CardPatternOptions
}
const props = withDefaults(defineProps<Props>(), {
	imageWidth: undefined,
	options: () => ({}),
})
const clipId = useId()
// density 控制整体尺寸；列距另按素材实际宽度计算，避免竖图沿用方格留白。
const patternOptions = computed<CardPatternOptions>(() => ({
	...props.options,
	columnStep:
		props.options.columnStep ??
		Math.max(
			...props.atlas.regions.map((region) => motifSize(region.id).width),
		) + 0.12,
}))
const motifs = computed(() => props.atlas.regions.map((region) => region.id))
const profiles = computed(() =>
	Object.fromEntries(
		props.atlas.regions
			.filter((region) => region.profile)
			.map((region) => [region.id, region.profile!]),
	),
)
const regions = computed(() =>
	Object.fromEntries(props.atlas.regions.map((region) => [region.id, region])),
)
function motifSize(motif: string) {
	const region = regions.value[motif]!
	const width =
		props.imageWidth ?? (region.width === region.height ? 0.88 : 0.62)
	return { width, height: (width * region.height) / region.width }
}
</script>
