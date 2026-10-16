<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { motion, useReducedMotion, vMotion } from 'motion-v'
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
const { isCompact } = useDisplayMode()
const mobileMenuOpen = ref(false)
const mobileMeasure = ref<HTMLElement | null>(null)
const currentItem = computed(
	() =>
		currentFallback.value ??
		baseNavItems.value.find((item) => isPathActive(item)) ??
		baseNavItems.value[0],
)
const navigationIcons: Record<string, string> = {
	overview: 'i-lucide-panels-top-left',
	project: 'i-lucide-folder-git-2',
	profile: 'i-lucide-user-round',
	journey: 'i-lucide-route',
	preference: 'i-lucide-heart',
}
const isMobileItemSelected = (item: MenuItem) =>
	item.key === currentItem.value?.key
const menuViewport = ref<HTMLElement | null>(null)
const menuInner = ref<HTMLElement | null>(null)
const menuBase = ref<HTMLElement | null>(null)
const fallbackMeasure = ref<HTMLElement | null>(null)
const displayedFallback = ref<MenuItem | null>(null)
const isAtBottom = ref(false)
const menuReady = ref(false)
const prefersReducedMotion = useReducedMotion()
const menuVisible = computed(() => menuReady.value && !isAtBottom.value)
const rawAtBottom = ref(false)
const BOTTOM_HIDE_DELAY = 180
const BOTTOM_SHOW_DELAY = 120
let resizeObserver: ResizeObserver | null = null
let bottomHideTimer: ReturnType<typeof setTimeout> | null = null
let bottomShowTimer: ReturnType<typeof setTimeout> | null = null
let scrollRaf = 0

const {
	fallbackSlotWidth,
	isMobileMenuClamped,
	menuShellStyle,
	syncFallbackWidth,
	syncShellWidth,
	syncViewportWidth,
} = usePageMenuSizing({
	mobileMeasure,
	menuBase,
	fallbackMeasure,
	onMeasured: () => syncPills(),
})
const {
	scheduleScrollActiveItemIntoView,
	scheduleFollowupScrollActiveItemIntoView,
} = usePageMenuActiveItem({ menuViewport })

const {
	selectedPillStyle,
	previewPillStyle,
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
	scrollOffset,
	updateScrollFollow,
	resetScrollTracking,
	onMenuPointerEnter,
	onMenuPointerDown,
	onMenuFocusIn,
	onMenuFocusOut,
} = usePageMenuScrollMotion({ menuVisible, prefersReducedMotion, menuPressed })
const { menuRevealMotion, menuSurfaceMotion, menuClipMotion, menuTextMotion } =
	usePageMenuMotion({ menuVisible, prefersReducedMotion })

watch([isCompact, menuVisible], () => {
	mobileMenuOpen.value = false
})

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
		if (next) {
			displayedFallback.value = next
			await syncFallbackWidth()
			scheduleScrollActiveItemIntoView('smooth')
			scheduleFollowupScrollActiveItemIntoView('smooth')
			return
		}

		if (!displayedFallback.value) {
			fallbackSlotWidth.value = 0
			return
		}

		fallbackSlotWidth.value = 0
		void syncShellWidth()
		if (prefersReducedMotion.value) {
			displayedFallback.value = null
		}
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
		mobileMenuOpen.value = false
		resetScrollTracking()
		void nextTick(updateBottomState)
		void nextTick(syncPills)
		scheduleScrollActiveItemIntoView('smooth')
	},
)

onMounted(() => {
	syncViewportWidth()
	void syncShellWidth().then(() => {
		menuReady.value = true
	})
	updateBottomState()
	isAtBottom.value = rawAtBottom.value
	if (currentFallback.value) {
		void syncFallbackWidth()
	}

	if (!menuBase.value || !fallbackMeasure.value) {
		return
	}

	resizeObserver = new ResizeObserver((entries) => {
		if (!entries[0]) {
			return
		}

		if (currentFallback.value) {
			void syncFallbackWidth()
		} else {
			void syncShellWidth()
		}
	})

	resizeObserver.observe(menuBase.value)
	if (mobileMeasure.value) resizeObserver.observe(mobileMeasure.value)
	resizeObserver.observe(fallbackMeasure.value)
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
})
const onFallbackTransitionEnd = (event: TransitionEvent) => {
	if (event.target !== event.currentTarget || event.propertyName !== 'width')
		return
	if (!currentFallback.value && fallbackSlotWidth.value === 0) {
		displayedFallback.value = null
	}
	void nextTick(syncPills)
}
</script>

<template>
	<aside>
		<div
			ref="mobileMeasure"
			class="pointer-events-none fixed left-0 top-0 -z-10 flex w-max items-center gap-2 whitespace-nowrap text-base leading-none font-semibold opacity-0"
			aria-hidden="true"
		>
			<span class="size-5 shrink-0" />
			<span>{{ currentItem?.label }}</span>
			<span class="size-4 shrink-0" />
		</div>
		<div
			ref="fallbackMeasure"
			class="pointer-events-none fixed left-0 top-0 -z-10 opacity-0 whitespace-nowrap rounded-full pl-3 pr-2 py-2 text-base leading-none font-semibold"
			aria-hidden="true"
		>
			{{ displayedFallback?.label ?? currentFallback?.label ?? '' }}
		</div>

		<div
			class="pointer-events-none fixed inset-x-0 bottom-0 z-10 h-36 bg-(--color-surface-0) mask-[linear-gradient(to_top,black_0%,rgba(0,0,0,0.55)_30%,rgba(0,0,0,0.16)_60%,rgba(0,0,0,0.02)_85%,transparent_100%)] transition-[opacity,translate] duration-600 ease-in-out motion-reduce:duration-0 motion-reduce:translate-y-0 dark:mask-[linear-gradient(to_top,black_0%,rgba(0,0,0,0.75)_30%,rgba(0,0,0,0.3)_60%,rgba(0,0,0,0.05)_85%,transparent_100%)]"
			:class="
				menuVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
			"
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
				@pointerdown="onMenuPointerDown"
				@pointerleave="menuHovered = false"
				@focusin="onMenuFocusIn"
				@focusout="onMenuFocusOut"
			>
				<div v-motion="menuRevealMotion" class="relative flex w-full">
					<div
						v-motion="menuSurfaceMotion"
						class="pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2 rounded-full border-[1.5px] border-slate-400/55 bg-white shadow-menu-floating dark:border-slate-700/80 dark:bg-slate-950 dark:shadow-[0_4rem_5rem_#000a0f33]"
						aria-hidden="true"
					/>
					<div
						v-motion="menuClipMotion"
						class="relative w-full rounded-full border-[1.5px] border-transparent px-2.5 lg:hidden"
						:class="menuVisible ? 'pointer-events-auto' : 'pointer-events-none'"
					>
						<UPopover
							v-model:open="mobileMenuOpen"
							:content="{ side: 'top', align: 'center', sideOffset: 12 }"
							:ui="{
								content: 'z-[40000] w-56 max-w-[calc(100vw-1.5rem)]',
							}"
						>
							<button
								type="button"
								class="flex h-8.5 w-full items-center justify-between gap-2 rounded-full text-base leading-none font-semibold text-primary dark:text-sky-300 outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
							>
								<svg
									class="size-5 shrink-0"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									aria-hidden="true"
								>
									<path d="M4 8h16M4 16h10" />
								</svg>
								<span
									v-motion="menuTextMotion"
									class="grid min-w-0 flex-1 text-center"
								>
									<Transition name="menu-label">
										<span
											:key="currentItem?.label"
											class="col-start-1 row-start-1 truncate"
											>{{ currentItem?.label }}</span
										>
									</Transition>
								</span>
								<UIcon
									mode="svg"
									name="i-lucide-chevron-up"
									class="size-4 shrink-0 text-slate-600 dark:text-slate-200 transition-transform duration-250 ease-in-out motion-reduce:transition-none"
									:class="{ 'rotate-180': mobileMenuOpen }"
								/>
							</button>
							<template #content>
								<nav class="flex flex-col gap-1 p-2">
									<NuxtLink
										v-for="item in displayNavItems"
										:key="item.key"
										:to="resolveTo(item)"
										:aria-current="
											isMobileItemSelected(item) ? 'page' : undefined
										"
										class="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-base transition-colors duration-200 motion-reduce:transition-none hover:bg-slate-100 focus-visible:bg-slate-100 dark:hover:bg-slate-800 dark:focus-visible:bg-slate-800 focus-visible:outline-none"
										:class="
											isMobileItemSelected(item)
												? 'bg-menu-highlight/28 font-semibold text-slate-800 dark:bg-menu-highlight/16 dark:text-slate-300'
												: 'text-slate-800 dark:text-slate-300'
										"
										@click="mobileMenuOpen = false"
									>
										<span class="flex min-w-0 items-center gap-3">
											<UIcon
												mode="svg"
												:name="
													navigationIcons[item.key] ?? 'i-lucide-file-text'
												"
												class="size-5 shrink-0"
											/>
											<span>{{ item.label }}</span>
										</span>
										<UIcon
											v-if="isMobileItemSelected(item)"
											mode="svg"
											name="i-lucide-check"
											class="size-5 shrink-0"
										/>
									</NuxtLink>
								</nav>
							</template>
						</UPopover>
					</div>
					<nav
						ref="menuViewport"
						v-motion="menuClipMotion"
						class="menu-viewport relative hidden lg:inline-flex w-full touch-none select-none flex-nowrap items-center justify-center gap-1 rounded-full border-[1.5px] border-transparent px-2.5"
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
							class="relative inline-flex w-max flex-none flex-nowrap items-center justify-center"
						>
							<div
								:style="selectedPillStyle"
								class="menu-selected pointer-events-none absolute left-0 top-0 rounded-xl will-change-[transform,opacity] motion-reduce:will-change-auto bg-menu-highlight/28 dark:bg-menu-highlight/16"
								aria-hidden="true"
							/>
							<div
								:style="previewPillStyle"
								class="menu-preview pointer-events-none absolute left-0 top-0 rounded-xl will-change-[transform,opacity] motion-reduce:will-change-auto bg-menu-highlight/12 dark:bg-menu-highlight/8"
								aria-hidden="true"
							/>

							<div
								ref="menuBase"
								class="inline-flex flex-none items-center gap-1"
							>
								<NuxtLink
									v-for="item in baseNavItems"
									:key="item.key"
									:to="resolveTo(item)"
									data-menu-link
									class="menu-link relative z-10 inline-flex h-8.5 items-center rounded-full px-2 text-base leading-none whitespace-nowrap motion-reduce:transition-none"
									:class="
										isPathActive(item)
											? 'font-semibold text-primary dark:text-sky-300'
											: 'font-normal text-slate-800 hover:text-primary dark:text-slate-200 dark:hover:text-primary-200'
									"
									:aria-current="isPathActive(item) ? 'page' : undefined"
								>
									{{ item.label }}
								</NuxtLink>
							</div>

							<div
								class="menu-fallback-slot overflow-hidden"
								@transitionend="onFallbackTransitionEnd"
								:style="{ width: `${fallbackSlotWidth}px` }"
							>
								<NuxtLink
									v-if="displayedFallback"
									:key="displayedFallback.to"
									:to="resolveTo(displayedFallback)"
									data-menu-link
									class="menu-link relative z-10 ml-1 flex h-8.5 w-max items-center rounded-full px-2 text-base leading-none whitespace-nowrap font-semibold text-primary motion-reduce:transition-none dark:text-sky-300"
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
.menu-link {
	transition:
		color 200ms ease-in-out,
		font-weight 350ms cubic-bezier(0.22, 1, 0.36, 1);
}

.menu-selected,
.menu-preview {
	transition:
		transform 380ms cubic-bezier(0.22, 1, 0.36, 1),
		opacity 180ms ease-out,
		width 220ms ease-out;
}

.menu-label-enter-active,
.menu-label-leave-active {
	transition:
		opacity 250ms ease,
		transform 250ms ease,
		filter 250ms ease;
}

.menu-label-enter-from {
	opacity: 0;
	transform: translateY(4px);
	filter: blur(3px);
}

.menu-label-leave-to {
	opacity: 0;
	transform: translateY(-4px);
	filter: blur(3px);
}

.menu-shell {
	width: var(--mobile-menu-width, 148px);
	max-width: calc(100vw - 1.5rem);
	transform: translateX(-50%);
}

.menu-shell,
.menu-fallback-slot {
	transition: width 500ms cubic-bezier(0.22, 1, 0.36, 1);
}

@media (width >= 64rem) {
	.menu-shell {
		width: var(--desktop-menu-width);
		max-width: none;
	}
}

@media (prefers-reduced-motion: reduce) {
	.menu-link,
	.menu-shell,
	.menu-fallback-slot,
	.menu-selected,
	.menu-preview,
	.menu-label-enter-active,
	.menu-label-leave-active {
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
