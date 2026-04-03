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
const SIDE_GUTTER = 12
let resizeObserver: ResizeObserver | null = null
let fallbackLeaveTimer: ReturnType<typeof setTimeout> | null = null

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
		key: '__fallback-nav__',
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

onMounted(() => {
	void syncShellWidth(false)

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
})

onBeforeUnmount(() => {
	resizeObserver?.disconnect()
	resizeObserver = null
	if (fallbackLeaveTimer) {
		clearTimeout(fallbackLeaveTimer)
		fallbackLeaveTimer = null
	}
})
</script>

<template>
	<div
		class="pointer-events-none fixed left-1/2 bottom-9 z-50 -translate-x-1/2 transition-[width] duration-350 ease-out"
		:style="
			shellWidth === null
				? undefined
				: { width: `${shellWidth + SIDE_GUTTER * 2}px` }
		"
	>
		<nav
			class="pointer-events-auto inline-flex w-full flex-nowrap items-center justify-center gap-1 overflow-hidden rounded-full border-[1.5px] border-primary-400 bg-white/70 px-2 shadow-[0_3rem_4rem_#000a0f7a] backdrop-blur-lg transition-[width] duration-350 ease-out dark:bg-slate-900/90"
		>
			<div
				ref="menuInner"
				class="inline-flex flex-nowrap items-center justify-center gap-1"
			>
				<NuxtLink
					v-for="item in baseNavItems"
					:key="item.key"
					:to="resolveTo(item)"
					:class="[
						'rounded-full p-2 text-sm md:text-base leading-none whitespace-nowrap transition-colors duration-350',
						isPathActive(item)
							? 'text-primary font-semibold'
							: 'text-slate-800 hover:text-primary-800',
					]"
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
					<Transition name="menu-fallback" appear>
						<NuxtLink
							v-if="displayedFallback"
							:key="displayedFallback.key"
							:to="resolveTo(displayedFallback)"
							class="rounded-full p-2 text-sm md:text-base leading-none whitespace-nowrap text-primary font-semibold transition-colors duration-350"
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
.menu-fallback-enter-active,
.menu-fallback-leave-active {
	transition:
		opacity 350ms ease-out,
		transform 350ms ease-out;
}

.menu-fallback-enter-from {
	opacity: 0;
	transform: translateX(8px) scale(0.98);
}

.menu-fallback-enter-to {
	opacity: 1;
	transform: translateX(0) scale(1);
}

.menu-fallback-leave-from {
	opacity: 1;
	transform: translateX(0) scale(1);
}

.menu-fallback-leave-to {
	opacity: 0;
	transform: translateX(8px) scale(0.98);
}
</style>
