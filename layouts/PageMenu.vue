<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

type MenuItem = {
	key: string
	label: string
	to: string
	isFallback?: boolean
}

const route = useRoute()
const localePath = useLocalePath()
const { t } = useI18n()
const menuInner = ref<HTMLElement | null>(null)
const fallbackSlot = ref<HTMLElement | null>(null)
const shellWidth = ref<number | null>(null)
const displayedFallback = ref<MenuItem | null>(null)
const fallbackSlotVisible = ref(false)
const fallbackSlotWidth = ref(0)
const isAtBottom = ref(false)
const SIDE_GUTTER = 12
let resizeObserver: ResizeObserver | null = null
let fallbackLeaveTimer: ReturnType<typeof setTimeout> | null = null
let scrollRaf = 0

const baseNavItems = computed<MenuItem[]>(() => [
	{ key: 'overview', label: t('menu.overview'), to: '/' },
	{ key: 'project', label: t('menu.project'), to: '/project' },
	{ key: 'profile', label: t('menu.profile'), to: '/profile' },
	{ key: 'more', label: t('menu.preference'), to: '/more' },
])

const resolveTo = (item: MenuItem): string => localePath(item.to)

const normalizePath = (path: string): string => {
	const matched = path.match(/^\/(?:zh-CN|ja-JP|en-US)(?=\/|$)(.*)$/)
	if (!matched) {
		return path
	}

	return matched[1] ? `/${matched[1].replace(/^\/+/, '')}` : '/'
}

const isPathActive = (
	item: MenuItem,
	currentPath: string = route.path,
): boolean => {
	const target = resolveTo(item)
	if (item.to === '/') {
		return currentPath === target
	}
	return currentPath === target || currentPath.startsWith(`${target}/`)
}

const currentFallback = computed<MenuItem | null>(() => {
	const hasCurrent = baseNavItems.value.some((item) => isPathActive(item))
	if (hasCurrent) {
		return null
	}

	const routeToLabelKey: Record<string, string> = {
		'/': 'menu.overview',
		'/project': 'menu.project',
		'/profile': 'menu.profile',
		'/more': 'menu.preference',
		'/about': 'menu.about',
		'/friends': 'menu.friends',
	}

	const normalizedPath = normalizePath(route.path)
	const fallbackLabel = t(routeToLabelKey[normalizedPath] || 'menu.currentPage')

	return {
		key: route.fullPath || route.path,
		label: fallbackLabel,
		to: route.fullPath || route.path,
		isFallback: true,
	}
})

const displayNavItems = computed<MenuItem[]>(() =>
	currentFallback.value
		? [...baseNavItems.value, currentFallback.value]
		: baseNavItems.value,
)

const measureFallbackWidth = async () => {
	await nextTick()
	const el = fallbackSlot.value
	if (!el) {
		return
	}

	fallbackSlotWidth.value = Math.ceil(el.scrollWidth)
}

const syncShellWidth = async (animate = true) => {
	if (!import.meta.client) {
		return
	}

	await nextTick()
	const inner = menuInner.value
	if (!inner) {
		return
	}

	const nextWidth = Math.ceil(inner.getBoundingClientRect().width)
	if (!animate || shellWidth.value === null) {
		shellWidth.value = nextWidth
		return
	}

	shellWidth.value = nextWidth
}

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
	const threshold = 12

	isAtBottom.value = scrollTop + viewportHeight >= scrollHeight - threshold
}

const onScroll = () => {
	if (scrollRaf) {
		return
	}

	scrollRaf = window.requestAnimationFrame(() => {
		scrollRaf = 0
		updateBottomState()
	})
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
			fallbackSlotWidth.value = 0
			await measureFallbackWidth()
			return
		}

		if (!displayedFallback.value) {
			fallbackSlotVisible.value = false
			fallbackSlotWidth.value = 0
			return
		}

		await measureFallbackWidth()
		fallbackSlotWidth.value = 0
		displayedFallback.value = null
		fallbackLeaveTimer = setTimeout(() => {
			fallbackSlotVisible.value = false
			fallbackLeaveTimer = null
		}, 350)
	},
	{ immediate: true },
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
		void nextTick(updateBottomState)
	},
)

onMounted(() => {
	void syncShellWidth(false)
	updateBottomState()

	if (!menuInner.value) {
		return
	}

	resizeObserver = new ResizeObserver((entries) => {
		const entry = entries[0]
		if (!entry) {
			return
		}

		shellWidth.value = Math.ceil(entry.contentRect.width)
	})

	resizeObserver.observe(menuInner.value)
	window.addEventListener('scroll', onScroll, { passive: true })
	window.addEventListener('resize', onScroll, { passive: true })
})

onBeforeUnmount(() => {
	resizeObserver?.disconnect()
	resizeObserver = null
	window.removeEventListener('scroll', onScroll)
	window.removeEventListener('resize', onScroll)
	if (scrollRaf) {
		window.cancelAnimationFrame(scrollRaf)
		scrollRaf = 0
	}
	if (fallbackLeaveTimer) {
		clearTimeout(fallbackLeaveTimer)
		fallbackLeaveTimer = null
	}
})
</script>

<template>
	<div
		class="pointer-events-none fixed left-1/2 z-50 -translate-x-1/2 transition-[width,bottom] duration-350 ease-out"
		:class="isAtBottom ? 'bottom-3' : 'bottom-9'"
		:style="
			shellWidth === null
				? undefined
				: { width: `${shellWidth + SIDE_GUTTER * 2}px` }
		"
	>
		<nav
			class="pointer-events-auto inline-flex w-full flex-nowrap items-center justify-center gap-1 overflow-hidden rounded-full border-[1.5px] border-slate-300 bg-white/70 px-2 backdrop-blur-lg transition-[width,box-shadow,border-color] duration-350 ease-out dark:border-slate-700 dark:bg-slate-900/90"
			:class="isAtBottom ? 'shadow-none' : 'shadow-[0_3rem_4rem_#000a0f7a]'"
		>
			<div
				ref="menuInner"
				class="inline-flex flex-nowrap items-center justify-center gap-1"
			>
				<NuxtLink
					v-for="item in baseNavItems"
					:key="item.key"
					:to="resolveTo(item)"
					class="menu-link rounded-full p-2 text-sm md:text-base leading-none whitespace-nowrap transition-all duration-350 ease-[cubic-bezier(0.22,1,0.36,1)]"
					:class="
						isPathActive(item)
							? 'menu-link--active font-semibold text-primary opacity-100 dark:text-sky-300'
							: 'text-slate-800 opacity-85 hover:opacity-100 hover:text-sky-700 dark:text-slate-300 dark:opacity-75 dark:hover:opacity-100 dark:hover:text-sky-100'
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
					<Transition name="menu-fallback" mode="out-in" appear>
						<NuxtLink
							v-if="displayedFallback"
							:key="displayedFallback.to"
							:to="resolveTo(displayedFallback)"
							class="menu-link menu-link--active rounded-full p-2 text-sm md:text-base leading-none whitespace-nowrap font-semibold text-primary opacity-100 transition-all duration-350 ease-[cubic-bezier(0.22,1,0.36,1)] dark:text-sky-300"
							aria-current="page"
						>
							{{ displayedFallback.label }}
						</NuxtLink>
					</Transition>
				</div>
			</div>
		</nav>
	</div>
</template>

<style scoped>
.menu-link {
	position: relative;
	z-index: 0;
}

.menu-link::before {
	content: '';
	position: absolute;
	left: 50%;
	bottom: 0.375em;
	z-index: -1;
	height: 0.75em;
	width: 90%;
	border-radius: 0.25rem;
	background: rgba(125, 211, 252, 0.28);
	box-shadow: 0 0 10px rgba(125, 211, 252, 0.18);
	opacity: 0;
	transform: translateX(-50%) translateY(0.24em) scaleY(0.2);
	transform-origin: center bottom;
	transition:
		opacity 350ms ease-out,
		transform 350ms ease-out,
		box-shadow 350ms ease-out;
	pointer-events: none;
}

.dark .menu-link::before {
	background: rgba(125, 211, 252, 0.16);
	box-shadow: 0 0 10px rgba(125, 211, 252, 0.12);
}

.menu-link:hover::before,
.menu-link--active::before {
	opacity: 1;
	transform: translateX(-50%) translateY(0) scaleY(1);
}

.menu-fallback-enter-active,
.menu-fallback-leave-active {
	transition: opacity 250ms ease-out;
}

.menu-fallback-enter-from {
	opacity: 0;
}

.menu-fallback-enter-to {
	opacity: 1;
}

.menu-fallback-leave-from {
	opacity: 1;
}

.menu-fallback-leave-to {
	opacity: 0;
}
</style>
