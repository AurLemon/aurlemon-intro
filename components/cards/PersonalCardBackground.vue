<template>
	<SvgCardBackground
		:options="{ density: 1 }"
		:materials="theme === 'night' ? nightMaterials : languageMaterials"
	/>
</template>
<script setup lang="ts">
import nightMaterials from '~/assets/resources/homepage/night/background.card-motifs.json?appearance'
import languageMaterials from '~/assets/resources/homepage/language/background.card-motifs.json?appearance'
import SvgCardBackground from './SvgCardBackground.vue'
interface Props {
	theme: 'night' | 'language'
}
defineProps<Props>()
</script>
