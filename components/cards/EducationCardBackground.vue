<template>
	<CardPatternBackground
		:motifs="badges"
		:profiles="profiles"
		:options="{ density: 0.95, blurLevel: 'standard', strengthLevel: 'subtle' }"
		:focus-active="!menuOpen"
	/>
</template>

<script setup lang="ts">
import type { CardAppearanceProfile } from '~/shared/types/card-appearance'
import CardPatternBackground from './CardPatternBackground.vue'

interface Props {
	menuOpen?: boolean
	badges: readonly string[]
	profiles: Readonly<Record<string, CardAppearanceProfile>>
}

defineProps<Props>()
</script>
