<template>
	<div
		class="pointer-events-none absolute inset-y-0 left-28 right-28 hidden items-center justify-center lg:flex"
		aria-hidden="true"
	>
		<p
			v-motion="titleMotion"
			class="max-w-full truncate font-sans text-base font-medium tracking-[0.06em] text-slate-800 dark:text-slate-300"
			:class="{ uppercase: displayedEnglish }"
		>
			{{ displayedTitle }}
		</p>
	</div>
</template>

<script setup lang="ts">
import { useReducedMotion, vMotion, type Options } from 'motion-v'

const route = useRoute()
const { t, locale } = useI18n({ useScope: 'global' })
const { isCompact } = useDisplayMode()
const nuxtApp = useNuxtApp()
const supportedPages = new Set([
	'project',
	'profile',
	'journey',
	'preference',
	'about',
])
const page = computed(() =>
	route.path
		.replace(/^\/(?:zh-CN|ja-JP|en-US)(?=\/|$)/, '')
		.replace(/^\/+|\/+$/g, ''),
)
const title = computed(() =>
	supportedPages.has(page.value)
		? t(`main.contentPages.${page.value}.title`)
		: '',
)
const scrolledPast = ref(false)
const visible = computed(
	() => !isCompact.value && !!title.value && scrolledPast.value,
)

const reducedMotion = useReducedMotion()
const displayedTitle = ref(title.value)
const displayedEnglish = ref(locale.value.startsWith('en'))
const switchingTitle = ref(false)
const hiddenSettled = ref(true)
const animatedVisible = computed(() => visible.value && !switchingTitle.value)

const commitTitle = () => {
	displayedTitle.value = title.value
	displayedEnglish.value = locale.value.startsWith('en')
	switchingTitle.value = false
}

watch(
	animatedVisible,
	(show) => {
		if (show) hiddenSettled.value = false
	},
	{ flush: 'sync' },
)

watch(
	[title, () => locale.value.startsWith('en'), reducedMotion],
	() => {
		if (
			displayedTitle.value === title.value &&
			displayedEnglish.value === locale.value.startsWith('en') &&
			!switchingTitle.value
		)
			return
		if (hiddenSettled.value || reducedMotion.value) {
			commitTitle()
			return
		}
		switchingTitle.value = true
	},
	{ flush: 'post' },
)

const handleAnimationComplete: NonNullable<Options['onAnimationComplete']> = (
	definition,
) => {
	if (
		!mounted ||
		animatedVisible.value ||
		!definition ||
		typeof definition !== 'object' ||
		!('opacity' in definition) ||
		definition.opacity !== 0
	)
		return
	hiddenSettled.value = true
	if (switchingTitle.value) commitTitle()
}

const titleMotion = computed<Options>(() => ({
	onAnimationComplete: handleAnimationComplete,
	initial: {
		opacity: 0,
		y: reducedMotion.value ? 0 : -4,
		scale: reducedMotion.value ? 1 : 0.96,
		filter: reducedMotion.value ? 'blur(0px)' : 'blur(5px)',
	},
	animate: {
		opacity: animatedVisible.value ? 1 : 0,
		y: reducedMotion.value ? 0 : animatedVisible.value ? 0 : -4,
		scale: reducedMotion.value || animatedVisible.value ? 1 : 0.96,
		filter:
			reducedMotion.value || animatedVisible.value ? 'blur(0px)' : 'blur(5px)',
	},
	transition: reducedMotion.value
		? { duration: 0 }
		: animatedVisible.value
			? {
					type: 'spring',
					stiffness: 300,
					damping: 20,
					mass: 0.8,
					opacity: { type: 'tween', duration: 0.2, ease: 'easeOut' },
					filter: { type: 'tween', duration: 0.3, ease: 'easeOut' },
				}
			: { type: 'tween', duration: 0.2, ease: 'easeIn' },
}))

let contentHeader: HTMLElement | null = null
let stickyHeader: HTMLElement | null = null
let pageContainer: HTMLElement | null = null
let mutationObserver: MutationObserver | undefined
let resizeObserver: ResizeObserver | undefined
let frame: number | null = null
let mounted = false
let targetDirty = true

const syncHeader = () => {
	frame = null
	if (!mounted) return

	if (!pageContainer?.isConnected) {
		pageContainer = document.querySelector<HTMLElement>('#page-container')
		mutationObserver?.disconnect()
		if (pageContainer) {
			mutationObserver?.observe(pageContainer, {
				childList: true,
				subtree: true,
				attributes: true,
				attributeFilter: ['data-content-page'],
			})
		}
		targetDirty = true
	}

	if (isCompact.value || !title.value) {
		if (contentHeader) resizeObserver?.unobserve(contentHeader)
		contentHeader = null
		scrolledPast.value = false
		return
	}

	if (
		targetDirty ||
		!contentHeader?.isConnected ||
		contentHeader.dataset.contentPage !== page.value
	) {
		if (contentHeader) resizeObserver?.unobserve(contentHeader)
		contentHeader = null
		// During route transitions the outgoing and incoming headers may coexist.
		for (const candidate of pageContainer?.querySelectorAll<HTMLElement>(
			'[data-content-header]',
		) ?? []) {
			if (candidate.dataset.contentPage === page.value)
				contentHeader = candidate
		}
		if (contentHeader) resizeObserver?.observe(contentHeader)
		targetDirty = false
	}

	if (!stickyHeader?.isConnected) {
		if (stickyHeader) resizeObserver?.unobserve(stickyHeader)
		stickyHeader = document.querySelector<HTMLElement>('[data-page-header]')
		if (stickyHeader) resizeObserver?.observe(stickyHeader)
	}

	scrolledPast.value =
		!!contentHeader &&
		!!stickyHeader &&
		contentHeader.getBoundingClientRect().bottom <=
			stickyHeader.getBoundingClientRect().bottom
}

const scheduleSync = () => {
	if (!mounted || frame !== null) return
	frame = requestAnimationFrame(syncHeader)
}

const invalidateTarget = () => {
	targetDirty = true
	scheduleSync()
}

const removePageFinishHook = nuxtApp.hook('page:finish', invalidateTarget)
const removePageTransitionHook = nuxtApp.hook(
	'page:transition:finish',
	invalidateTarget,
)

watch(
	[() => route.fullPath, locale, isCompact],
	() => {
		scrolledPast.value = false
		invalidateTarget()
	},
	{ flush: 'post' },
)

onMounted(() => {
	mounted = true
	mutationObserver = new MutationObserver(invalidateTarget)
	resizeObserver = new ResizeObserver(scheduleSync)
	window.addEventListener('scroll', scheduleSync, { passive: true })
	window.addEventListener('resize', scheduleSync, { passive: true })
	window.addEventListener('pageshow', invalidateTarget)
	invalidateTarget()
})

onBeforeUnmount(() => {
	mounted = false
	if (frame !== null) cancelAnimationFrame(frame)
	mutationObserver?.disconnect()
	resizeObserver?.disconnect()
	window.removeEventListener('scroll', scheduleSync)
	window.removeEventListener('resize', scheduleSync)
	window.removeEventListener('pageshow', invalidateTarget)
	removePageFinishHook()
	removePageTransitionHook()
})
</script>
