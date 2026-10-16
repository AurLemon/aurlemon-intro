<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { resetPageEnter, resolvePageEnter } from '~/utils/page-scroll'

const pageContainerReady = ref(false)

const handlePageEnter = (element: Element): void => {
	// Commit enter-from after insertion. Otherwise a ready page can reach
	// enter-to before the browser establishes its initial transparent style.
	element.getBoundingClientRect()

	// Enter runs after insertion; the destination must have a scrollable layout.
	requestAnimationFrame(() => {
		if (!element.isConnected) return
		const path = element.getAttribute('data-page-path')
		if (path) resolvePageEnter(path)
	})
}

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
		class="mx-auto max-w-4xl w-full h-full flex-1 flex flex-col px-6 pb-28 lg:pb-16"
		:class="{
			'page-container-shell': true,
			'page-container-shell--ready': pageContainerReady,
		}"
	>
		<NuxtPage
			v-slot="{ Component, route: pageRoute }"
			:transition="{
				name: 'page',
				mode: 'out-in',
				onBeforeLeave: resetPageEnter,
				onEnter: handlePageEnter,
			}"
		>
			<div
				:key="pageRoute.path"
				:data-page-path="pageRoute.path"
				class="min-w-0 flex flex-1 flex-col"
				:class="
					/^\/(?:\w{2}-\w{2}\/?)*$/.test(pageRoute.path)
						? 'pt-8'
						: 'pt-2 lg:pt-0'
				"
			>
				<component :is="Component" />
			</div>
		</NuxtPage>
	</main>
</template>

<style scoped>
.page-container-shell {
	opacity: 0;
	transform: translate3d(0, 18px, 0);
	transition:
		opacity 560ms cubic-bezier(0.22, 1, 0.36, 1),
		transform 560ms cubic-bezier(0.22, 1, 0.36, 1);
}

.page-container-shell--ready {
	opacity: 1;
	transform: none;
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
