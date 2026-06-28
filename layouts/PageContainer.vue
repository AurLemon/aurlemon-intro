<script setup lang="ts">
import { onMounted, ref } from 'vue'

const pageContainerReady = ref(false)

onMounted(() => {
	const revealContainer = () => {
		pageContainerReady.value = true
	}

	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
		revealContainer()
		return
	}

	requestAnimationFrame(() => {
		requestAnimationFrame(revealContainer)
	})
})
</script>

<template>
	<main
		id="page-container"
		class="mx-auto max-w-4xl w-full h-full flex-1 flex flex-col px-6 pt-8 pb-28 lg:pb-16"
		:class="{
			'page-container-shell': true,
			'page-container-shell--ready': pageContainerReady,
		}"
	>
		<NuxtPage />
	</main>
</template>

<style scoped>
.page-container-shell {
	opacity: 0;
	transform: translate3d(0, 18px, 0);
	transition:
		opacity 560ms cubic-bezier(0.22, 1, 0.36, 1),
		transform 560ms cubic-bezier(0.22, 1, 0.36, 1);
	will-change: opacity, transform;
}

.page-container-shell--ready {
	opacity: 1;
	transform: translate3d(0, 0, 0);
}

@media (prefers-reduced-motion: reduce) {
	.page-container-shell,
	.page-container-shell--ready {
		opacity: 1;
		transform: none;
		transition: none;
	}
}
</style>
