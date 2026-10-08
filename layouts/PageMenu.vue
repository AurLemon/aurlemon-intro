<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { AnimatePresence, motion, useReducedMotion, vMotion } from 'motion-v'
import {
	usePageMenuNavigation,
	type MenuItem,
} from '~/composables/usePageMenuNavigation'
import { usePageMenuPreview } from '~/composables/usePageMenuPreview'
import { usePageMenuScrollMotion } from '~/composables/usePageMenuScrollMotion'
import { usePageMenuMotion } from '~/composables/usePageMenuMotion'
import { usePageMenuSizing } from '~/composables/usePageMenuSizing'
import { usePageMenuActiveItem } from '~/composables/usePageMenuActiveItem'

const {
	route,
	baseNavItems,
	currentFallback,
	displayNavItems,
	resolveTo,
	isPathActive,
} = usePageMenuNavigation()
const menuViewport = ref<HTMLElement | null>(null)
const menuInner = ref<HTMLElement | null>(null)
const fallbackSlot = ref<HTMLElement | null>(null)
const fallbackMeasure = ref<HTMLElement | null>(null)
const displayedFallback = ref<MenuItem | null>(null)
const fallbackSlotVisible = ref(false)
const isAtBottom = ref(false)
const menuReady = ref(false)
const prefersReducedMotion = useReducedMotion()
const menuVisible = computed(() => menuReady.value && !isAtBottom.value)
const rawAtBottom = ref(false)
const BOTTOM_HIDE_DELAY = 180
const BOTTOM_SHOW_DELAY = 120
const FALLBACK_SLOT_TRANSITION_MS = 350
let resizeObserver: ResizeObserver | null = null
let bottomHideTimer: ReturnType<typeof setTimeout> | null = null
let bottomShowTimer: ReturnType<typeof setTimeout> | null = null
let fallbackLeaveTimer: ReturnType<typeof setTimeout> | null = null
let scrollRaf = 0

const {
	fallbackSlotWidth,
	isMobileMenuClamped,
	menuShellStyle,
	syncFallbackWidth,
	syncShellWidth,
	syncViewportWidth,
} = usePageMenuSizing({
	menuInner,
	fallbackMeasure,
	onMeasured: () => syncPills(),
})
const {
	scheduleScrollActiveItemIntoView,
	scheduleFollowupScrollActiveItemIntoView,
} = usePageMenuActiveItem({ menuViewport })

const {
	selectedPillMotion,
	previewPill,
	previewOrigin,
	previewSession,
	previewTransition,
	menuPressed,
	syncPills,
	clearPreview,
	onPreviewPointerEnter,
	onPreviewPointerDown,
	onPreviewPointerMove,
	onPreviewPointerUp,
	onPreviewPointerCancel,
	onMenuClickCapture,
	onPreviewFocus,
} = usePageMenuPreview({
	menuViewport,
	menuInner,
	isMobileMenuClamped,
	prefersReducedMotion,
})
const {
	menuHovered,
	menuFocused,
	scrollOffset,
	updateScrollFollow,
	resetScrollTracking,
	onMenuPointerEnter,
	onMenuFocusOut,
} = usePageMenuScrollMotion({ menuVisible, prefersReducedMotion, menuPressed })
const { menuRevealMotion, menuSurfaceMotion, menuClipMotion, menuTextMotion } =
	usePageMenuMotion({ menuVisible, prefersReducedMotion })

const updateBottomState = () => {
	if (!import.meta.client) {
		return
	}

	const doc = document.documentElement
	const scrollTop = window.scrollY || doc.scrollTop || 0
	const viewportHeight = window.innerHeight
	const scrollHeight = Math.max(
		doc.scrollHeight,
		document.body?.scrollHeight ?? 0,
	)
	const threshold = 32

	const nextAtBottom = scrollTop + viewportHeight >= scrollHeight - threshold
	if (nextAtBottom === rawAtBottom.value) {
		return
	}

	rawAtBottom.value = nextAtBottom
	if (nextAtBottom) {
		if (bottomShowTimer) {
			clearTimeout(bottomShowTimer)
			bottomShowTimer = null
		}
		if (isAtBottom.value || bottomHideTimer) {
			return
		}
		bottomHideTimer = setTimeout(() => {
			bottomHideTimer = null
			if (rawAtBottom.value) {
				isAtBottom.value = true
			}
		}, BOTTOM_HIDE_DELAY)
		return
	}

	if (bottomHideTimer) {
		clearTimeout(bottomHideTimer)
		bottomHideTimer = null
	}
	if (!isAtBottom.value) {
		if (bottomShowTimer) {
			clearTimeout(bottomShowTimer)
			bottomShowTimer = null
		}
		return
	}
	if (bottomShowTimer) {
		return
	}
	bottomShowTimer = setTimeout(() => {
		bottomShowTimer = null
		if (!rawAtBottom.value) {
			isAtBottom.value = false
		}
	}, BOTTOM_SHOW_DELAY)
}

const onScroll = () => {
	if (scrollRaf) {
		return
	}

	scrollRaf = window.requestAnimationFrame((time) => {
		scrollRaf = 0
		updateBottomState()
		updateScrollFollow(time)
	})
}

const onResize = () => {
	resetScrollTracking()
	syncViewportWidth()
	onScroll()
}

watch(
	currentFallback,
	async (next) => {
		if (fallbackLeaveTimer) {
			clearTimeout(fallbackLeaveTimer)
			fallbackLeaveTimer = null
		}

		if (next) {
			displayedFallback.value = next
			fallbackSlotVisible.value = true
			await syncFallbackWidth()
			scheduleScrollActiveItemIntoView('smooth')
			scheduleFollowupScrollActiveItemIntoView('smooth')
			return
		}

		if (!displayedFallback.value) {
			fallbackSlotVisible.value = false
			fallbackSlotWidth.value = 0
			return
		}

		fallbackSlotWidth.value = 0
		void syncShellWidth()
		fallbackLeaveTimer = setTimeout(() => {
			displayedFallback.value = null
			fallbackSlotVisible.value = false
			fallbackLeaveTimer = null
		}, FALLBACK_SLOT_TRANSITION_MS)
	},
	{ immediate: true },
)

watch(
	() => displayedFallback.value?.label,
	() => {
		if (!displayedFallback.value) {
			return
		}

		void syncFallbackWidth()
	},
)

watch(
	() =>
		displayNavItems.value.map((item) => `${item.key}:${item.label}`).join('|'),
	() => {
		void syncShellWidth()
	},
)

watch(
	() => route.fullPath,
	() => {
		resetScrollTracking()
		void nextTick(updateBottomState)
		void nextTick(syncPills)
		scheduleScrollActiveItemIntoView('smooth')
	},
)

onMounted(() => {
	syncViewportWidth()
	void syncShellWidth(false).then(() => {
		menuReady.value = true
	})
	updateBottomState()
	isAtBottom.value = rawAtBottom.value
	if (currentFallback.value) {
		void syncFallbackWidth()
	}

	if (!menuInner.value) {
		return
	}

	resizeObserver = new ResizeObserver((entries) => {
		if (!entries[0]) {
			return
		}

		void syncShellWidth(false)
	})

	resizeObserver.observe(menuInner.value)
	window.addEventListener('scroll', onScroll, { passive: true })
	window.addEventListener('resize', onResize, { passive: true })
})

onBeforeUnmount(() => {
	resizeObserver?.disconnect()
	resizeObserver = null
	window.removeEventListener('scroll', onScroll)
	window.removeEventListener('resize', onResize)
	if (scrollRaf) {
		window.cancelAnimationFrame(scrollRaf)
		scrollRaf = 0
	}
	if (bottomHideTimer) {
		clearTimeout(bottomHideTimer)
		bottomHideTimer = null
	}
	if (bottomShowTimer) {
		clearTimeout(bottomShowTimer)
		bottomShowTimer = null
	}
	if (fallbackLeaveTimer) {
		clearTimeout(fallbackLeaveTimer)
		fallbackLeaveTimer = null
	}
})
</script>

<template>
	<aside>
		<div
			ref="fallbackMeasure"
			class="pointer-events-none fixed left-0 top-0 -z-10 opacity-0 whitespace-nowrap rounded-full px-2 py-2 text-base leading-none font-semibold"
			aria-hidden="true"
		>
			{{ displayedFallback?.label ?? currentFallback?.label ?? '' }}
		</div>

		<div
			class="pointer-events-none fixed inset-x-0 bottom-0 z-10 h-36 bg-(--color-surface-0) mask-[linear-gradient(to_top,black_0%,rgba(0,0,0,0.55)_30%,rgba(0,0,0,0.16)_60%,rgba(0,0,0,0.02)_85%,transparent_100%)] transition-opacity duration-360 ease-in-out motion-reduce:duration-0 dark:mask-[linear-gradient(to_top,black_0%,rgba(0,0,0,0.75)_30%,rgba(0,0,0,0.3)_60%,rgba(0,0,0,0.05)_85%,transparent_100%)]"
			:class="menuVisible ? 'opacity-100' : 'opacity-0'"
			aria-hidden="true"
		/>

		<div
			class="menu-shell pointer-events-none fixed left-1/2 bottom-14 z-100"
			:aria-hidden="!menuVisible"
			:inert="!menuVisible"
			:style="menuShellStyle"
		>
			<motion.div
				:style="{ y: scrollOffset }"
				class="w-full"
				@pointerenter="onMenuPointerEnter"
				@pointerleave="menuHovered = false"
				@focusin="menuFocused = true"
				@focusout="onMenuFocusOut"
			>
				<div v-motion="menuRevealMotion" class="relative flex w-full">
					<div
						v-motion="menuSurfaceMotion"
						class="pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2 rounded-full border-[1.5px] border-slate-400/55 bg-white shadow-menu-floating dark:border-slate-700/80 dark:bg-slate-950 dark:shadow-[0_4rem_5rem_#000a0f33]"
						aria-hidden="true"
					/>
					<nav
						ref="menuViewport"
						v-motion="menuClipMotion"
						class="menu-viewport relative inline-flex w-full touch-none select-none flex-nowrap items-center justify-center gap-1 rounded-full border-[1.5px] border-transparent px-2.5"
						@pointerdown="onPreviewPointerDown"
						@pointerenter="onPreviewPointerEnter"
						@pointermove="onPreviewPointerMove"
						@pointerup="onPreviewPointerUp"
						@pointercancel="onPreviewPointerCancel"
						@pointerleave="clearPreview"
						@click.capture="onMenuClickCapture"
						@focusin="onPreviewFocus"
						@focusout="clearPreview"
						:class="[
							isMobileMenuClamped
								? 'overflow-x-auto overflow-y-hidden justify-start'
								: 'overflow-hidden justify-center',
							menuVisible ? 'pointer-events-auto' : 'pointer-events-none',
						]"
					>
						<div
							ref="menuInner"
							v-motion="menuTextMotion"
							class="relative inline-flex w-max flex-none flex-nowrap items-center justify-center gap-1"
						>
							<div
								v-motion="selectedPillMotion"
								class="pointer-events-none absolute left-0 top-0 rounded-xl bg-menu-highlight/28 dark:bg-menu-highlight/16"
								aria-hidden="true"
							/>
							<AnimatePresence>
								<motion.div
									v-if="previewPill"
									:key="previewSession"
									:initial="{
										...previewOrigin,
										opacity: 0,
										scale: prefersReducedMotion ? 1 : 0.94,
									}"
									:animate="{
										...previewPill,
										opacity: 1,
										scale: menuPressed ? 0.985 : 1,
									}"
									:exit="{ opacity: 0, scale: prefersReducedMotion ? 1 : 0.97 }"
									:transition="previewTransition"
									class="pointer-events-none absolute left-0 top-0 rounded-xl bg-menu-highlight/12 dark:bg-menu-highlight/8"
									aria-hidden="true"
								/>
							</AnimatePresence>
							<NuxtLink
								v-for="item in baseNavItems"
								:key="item.key"
								:to="resolveTo(item)"
								data-menu-link
								class="menu-link relative z-10 inline-flex h-8.5 items-center rounded-full px-2 text-base leading-none whitespace-nowrap transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
								:class="
									isPathActive(item)
										? 'font-semibold text-primary dark:text-sky-300'
										: 'font-normal text-slate-800 hover:text-primary dark:text-slate-200 dark:hover:text-primary-200'
								"
								:aria-current="isPathActive(item) ? 'page' : undefined"
							>
								{{ item.label }}
							</NuxtLink>

							<div
								v-if="fallbackSlotVisible"
								ref="fallbackSlot"
								class="overflow-hidden transition-[width] duration-350 ease-out"
								:style="{ width: `${fallbackSlotWidth}px` }"
							>
								<NuxtLink
									v-if="displayedFallback"
									:key="displayedFallback.to"
									:to="resolveTo(displayedFallback)"
									data-menu-link
									class="menu-link relative z-10 flex h-8.5 items-center rounded-full px-2 text-base leading-none whitespace-nowrap font-semibold text-primary transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] dark:text-sky-300"
									aria-current="page"
								>
									{{ displayedFallback.label }}
								</NuxtLink>
							</div>
						</div>
					</nav>
				</div>
			</motion.div>
		</div>
	</aside>
</template>

<style scoped>
.menu-shell {
	transform: translateX(-50%);
	transition: width 500ms cubic-bezier(0.22, 1, 0.36, 1);
}

@media (prefers-reduced-motion: reduce) {
	.menu-shell {
		transition: none;
	}
}

.menu-viewport {
	-ms-overflow-style: none;
	scrollbar-width: none;
}

.menu-viewport::-webkit-scrollbar {
	display: none;
}
</style>
