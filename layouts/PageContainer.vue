<script setup lang="ts">
import { onMounted, ref } from 'vue'
import {
	resetPageEnter,
	resolvePageEnter,
	type PageScrollPosition,
} from '~/utils/page-scroll'

const pageContainerReady = ref(false)
const pageEnterAnimations = new WeakMap<Element, Animation>()
const pageEnterFrames = new WeakMap<Element, number>()
const pageScrollCleanups = new WeakMap<Element, () => void>()

const restoreScrollWithEnter = (
	element: Element,
	animation: Animation,
	position: PageScrollPosition,
): void => {
	const startX = window.scrollX
	const startY = window.scrollY
	const targetX = Math.max(
		0,
		Math.min(position.left, document.documentElement.scrollWidth - innerWidth),
	)
	const targetY = Math.max(
		0,
		Math.min(position.top, document.documentElement.scrollHeight - innerHeight),
	)
	const distance = Math.hypot(targetX - startX, targetY - startY)
	if (distance < 1) return

	// Keep the browser's smooth scroll; let its real progress drive the fade.
	animation.pause()
	animation.effect?.updateTiming({ easing: 'linear' })
	animation.currentTime = 0
	let lastX = startX
	let lastY = startY
	let lastMovement = performance.now()
	let progress = 0
	let frame = 0
	const cleanup = () => {
		cancelAnimationFrame(frame)
		pageScrollCleanups.delete(element)
	}
	const update = (now: number) => {
		const x = window.scrollX
		const y = window.scrollY
		const remaining = Math.hypot(targetX - x, targetY - y)
		if (Math.hypot(x - lastX, y - lastY) > 0.5) lastMovement = now
		lastX = x
		lastY = y
		progress = Math.max(progress, Math.min(1, 1 - remaining / distance))
		animation.currentTime = progress * 220
		if (remaining < 1) {
			cleanup()
			animation.finish()
			return
		}
		// User input can interrupt native scrolling before it reaches the target.
		if (now - lastMovement > 160) {
			cleanup()
			animation.play()
			return
		}
		frame = requestAnimationFrame(update)
	}
	pageScrollCleanups.set(element, cleanup)
	window.scrollTo({ left: targetX, top: targetY, behavior: 'smooth' })
	frame = requestAnimationFrame(update)
}

const handlePageEnter = (element: Element, done: () => void): void => {
	// Enter runs after insertion; the destination must have a scrollable layout.
	const frame = requestAnimationFrame(() => {
		pageEnterFrames.delete(element)
		if (!element.isConnected) return
		const path = element.getAttribute('data-page-path')
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			if (path) resolvePageEnter(path)
			done()
			return
		}

		// Start the clock after mounting, so page setup cannot consume the fade.
		const animation = element.animate(
			[
				{ opacity: 0, transform: 'translateY(6px)' },
				{ opacity: 1, transform: 'translateY(0)' },
			],
			{ duration: 220, easing: 'ease', fill: 'both' },
		)
		pageEnterAnimations.set(element, animation)
		animation.onfinish = () => {
			pageScrollCleanups.get(element)?.()
			done()
			animation.cancel()
			pageEnterAnimations.delete(element)
		}
		if (path) {
			resolvePageEnter(path, (position) =>
				restoreScrollWithEnter(element, animation, position),
			)
		}
	})
	pageEnterFrames.set(element, frame)
}

const cancelPageEnter = (element: Element): void => {
	if (pageScrollCleanups.has(element)) {
		pageScrollCleanups.get(element)?.()
		window.scrollTo({
			left: window.scrollX,
			top: window.scrollY,
			behavior: 'instant',
		})
	}
	const frame = pageEnterFrames.get(element)
	if (frame !== undefined) cancelAnimationFrame(frame)
	pageEnterFrames.delete(element)
	pageEnterAnimations.get(element)?.cancel()
	pageEnterAnimations.delete(element)
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
				onEnterCancelled: cancelPageEnter,
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
