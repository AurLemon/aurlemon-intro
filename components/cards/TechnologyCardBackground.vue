<template>
	<SvgCardBackground :materials="materials" :options="{ density: 1 }" />
</template>
<script setup lang="ts">
import materials from '~/assets/resources/homepage/technology/background.card-motifs.json?appearance'
import SvgCardBackground from './SvgCardBackground.vue'
</script>
