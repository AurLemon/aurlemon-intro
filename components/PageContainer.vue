<template>
	<main class="aurle-page-container" :class="{ 'top-background': isHomePage }">
		<NuxtPage />
	</main>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const isHomePage = ref(route.path !== '/')

watch(
	() => route.path,
	(newPath) => {
		isHomePage.value = newPath !== '/'
	},
)
</script>
