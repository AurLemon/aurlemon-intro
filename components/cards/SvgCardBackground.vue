<template>
	<div class="pointer-events-none absolute inset-0" aria-hidden="true">
		<svg class="absolute h-0 w-0 overflow-hidden" aria-hidden="true">
			<defs>
				<symbol
					v-for="motif in materials.motifs"
					:id="`${symbolId}-${motif.id}`"
					:key="motif.id"
					viewBox="0 0 1 1"
				>
					<!-- 仅来自仓库内受信任的 SVG 清单，不接受用户输入或远程 HTML。 -->
					<!-- eslint-disable-next-line vue/no-v-html -->
					<g v-html="normalizeSvg(motif)" />
				</symbol>
			</defs>
		</svg>
		<CardPatternBackground
			:motifs="motifs"
			:profiles="materials.profiles"
			:options="options"
		>
			<template #motif="{ motif }">
				<use :href="`#${symbolId}-${motif}`" width="0.88" height="0.88" />
			</template>
		</CardPatternBackground>
	</div>
</template>
<script setup lang="ts">
import { computed, useId } from 'vue'
import type {
	CardSvgMaterials,
	CardSvgMotif,
} from '~/shared/types/card-appearance'
import type { CardPatternOptions } from './cardPattern'
import CardPatternBackground from './CardPatternBackground.vue'
interface Props {
	materials: CardSvgMaterials
	options?: CardPatternOptions
}
const props = withDefaults(defineProps<Props>(), { options: () => ({}) })
const symbolId = useId()
const motifs = computed(() => props.materials.motifs.map((motif) => motif.id))
const normalizeSvg = (motif: CardSvgMotif) =>
	motif.svg
		.replace('<svg ', '<svg width="1" height="1" ')
		.replaceAll('__ID__', `${symbolId}-${motif.id}`)
		.replace('font-family="serif"', 'class="font-serif"')
</script>
