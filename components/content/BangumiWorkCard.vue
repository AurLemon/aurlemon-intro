<template>
	<div
		data-bangumi-card
		class="group/work relative block w-40 min-w-0 shrink-0 snap-start rounded-lg"
	>
		<NuxtLink
			:to="item.url"
			target="_blank"
			rel="noopener noreferrer"
			class="block rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
		>
			<div
				ref="frame"
				class="relative isolate aspect-[5/7] w-full overflow-hidden rounded-lg select-none bg-(--color-surface-2) [clip-path:inset(0_round_var(--radius-lg))] dark:bg-(--color-surface-1)"
			>
				<img
					v-for="layer in coverLayers"
					:key="layer.src"
					:src="layer.src"
					:alt="layer.previous ? '' : item.name"
					:aria-hidden="layer.previous || undefined"
					decoding="async"
					referrerpolicy="no-referrer"
					draggable="false"
					@dragstart.prevent
					class="absolute inset-0 h-full w-full object-cover"
					:class="
						layer.previous
							? 'bangumi-cover-previous'
							: ['bangumi-cover z-1', { 'bangumi-cover-covered': coverCovered }]
					"
					@transitionend="!layer.previous && finishCover($event)"
					@error="!layer.previous && onDisplayedCoverError($event)"
				/>
				<p
					v-if="failedUrl"
					class="absolute inset-0 flex items-center justify-center px-3 pb-12 text-center font-sans text-xs text-slate-500"
					role="status"
				>
					{{ $t('main.preference.bangumiCoverFailed') }}
				</p>
				<Transition name="bangumi-badge">
					<UBadge
						:key="status"
						class="absolute top-1 left-1 z-30 !bg-slate-100/90 font-sans !text-slate-700 backdrop-blur-sm dark:!bg-slate-800/90 dark:!text-slate-200"
						size="sm"
						color="neutral"
						variant="soft"
						>{{ status }}</UBadge
					>
				</Transition>
				<span
					aria-hidden="true"
					class="pointer-events-none absolute inset-0 z-10 rounded-lg bg-black/20 opacity-0 transition-opacity duration-200 group-hover/work:opacity-100 group-focus-within/work:opacity-100 motion-reduce:transition-none"
				/>
				<span
					aria-hidden="true"
					class="pointer-events-none absolute inset-0 z-20 rounded-lg border border-slate-300/80 transition-colors duration-200 group-hover/work:border-slate-400 dark:border-slate-600/80 dark:group-hover/work:border-slate-500 motion-reduce:transition-none"
				/>
			</div>
			<p
				:title="item.name"
				class="relative mt-2 h-6 overflow-hidden font-serif text-base leading-6 font-medium text-slate-700 dark:text-slate-200"
			>
				<Transition name="bangumi-title">
					<span
						:key="`${item.subjectId}-${item.name}`"
						class="absolute inset-0 block truncate"
						>{{ item.name }}</span
					>
				</Transition>
			</p>
		</NuxtLink>
		<UButton
			v-if="failedUrl"
			size="xs"
			color="neutral"
			variant="soft"
			class="absolute left-1/2 top-28 z-30 -translate-x-1/2"
			@click="retryCover"
			>{{ $t('main.preference.bangumiRetry') }}</UButton
		>
	</div>
</template>

<script setup lang="ts">
import type { BangumiWorkItem } from '~/shared/types/bangumi'
interface Props {
	item: BangumiWorkItem
	status: string
}
const props = defineProps<Props>()
const frame = ref<HTMLElement | null>(null)
const shownCover = ref('')
const failedUrl = ref<string | null>(null)
const previousCover = ref<string | null>(null)
const coverCovered = ref(false)
interface CoverLayer {
	src: string
	previous: boolean
}
// Keep the outgoing decoded DOM image; a new URL gets its own hidden layer.
const coverLayers = computed<CoverLayer[]>(() => [
	...(previousCover.value
		? [{ src: previousCover.value, previous: true }]
		: []),
	...(shownCover.value ? [{ src: shownCover.value, previous: false }] : []),
])

let revision = 0
const visible = ref(false)
let decodingImage: HTMLImageElement | null = null
let observer: IntersectionObserver | undefined
let revealFrame = 0
let revealNextFrame = 0
let coverAnimating = false
let completionTimer: ReturnType<typeof setTimeout> | undefined
const completeCover = () => {
	if (!coverAnimating) return
	coverAnimating = false
	coverCovered.value = false
	previousCover.value = null
	if (completionTimer) clearTimeout(completionTimer)
	completionTimer = undefined
	void updateCover()
}
const finishCover = (event: TransitionEvent) => {
	if (event.propertyName === 'opacity' && !coverCovered.value) completeCover()
}
const intersectsViewport = (): boolean => {
	const element = frame.value
	if (!element) return false
	const bounds = element.getBoundingClientRect()
	const viewport = element
		.closest('.horizontal-scroller')
		?.getBoundingClientRect()
	return (
		bounds.right > Math.max(0, viewport?.left ?? 0) &&
		bounds.left <
			Math.min(window.innerWidth, viewport?.right ?? window.innerWidth) &&
		bounds.bottom > Math.max(0, viewport?.top ?? 0) &&
		bounds.top <
			Math.min(window.innerHeight, viewport?.bottom ?? window.innerHeight)
	)
}
const resetCoverAnimation = () => {
	cancelAnimationFrame(revealFrame)
	cancelAnimationFrame(revealNextFrame)
	if (completionTimer) clearTimeout(completionTimer)
	completionTimer = undefined
	coverAnimating = false
	coverCovered.value = false
	previousCover.value = null
}
const failCover = (url: string) => {
	resetCoverAnimation()
	shownCover.value = ''
	failedUrl.value = url
}
const onDisplayedCoverError = (event: Event) => {
	const image = event.target
	if (
		image instanceof HTMLImageElement &&
		image.getAttribute('src') === props.item.coverUrl
	)
		failCover(props.item.coverUrl)
}
const retryCover = () => {
	failedUrl.value = null
	void updateCover()
}
const updateCover = async () => {
	if (coverAnimating || !visible.value || !intersectsViewport()) return
	const url = props.item.coverUrl
	const current = revision
	if (url === shownCover.value || url === failedUrl.value) return
	if (!url) {
		resetCoverAnimation()
		shownCover.value = ''
		return
	}
	const image = new Image()
	decodingImage = image
	image.referrerPolicy = 'no-referrer'
	image.src = url
	try {
		await image.decode()
		if (!image.naturalWidth) throw new Error('BANGUMI_COVER_DECODE_FAILED')
	} catch {
		if (current === revision && visible.value && intersectsViewport())
			failCover(url)
		return
	} finally {
		if (decodingImage === image) decodingImage = null
	}
	if (current !== revision || !visible.value || !intersectsViewport()) return
	failedUrl.value = null
	if (
		!shownCover.value ||
		window.matchMedia('(prefers-reduced-motion: reduce)').matches
	) {
		shownCover.value = url
		previousCover.value = null
		coverCovered.value = false
		return
	}

	coverAnimating = true
	previousCover.value = shownCover.value
	shownCover.value = url
	coverCovered.value = true
	await nextTick()
	if (!coverAnimating) return
	// Finish this reveal before applying the latest queued URL. Prop changes must
	// not cancel these frames or reset a half-revealed image to opacity zero.
	revealFrame = requestAnimationFrame(() => {
		revealNextFrame = requestAnimationFrame(() => {
			if (!coverAnimating) return
			coverCovered.value = false
			completionTimer = setTimeout(completeCover, 650)
		})
	})
}
watch([visible, () => props.item.coverUrl], async ([isVisible, url]) => {
	const current = ++revision
	if (failedUrl.value !== url) failedUrl.value = null
	decodingImage?.removeAttribute('src')
	decodingImage = null
	// Restore the selected category's scroll position before deciding what loads.
	await nextTick()
	if (current !== revision) return
	if (!isVisible || !intersectsViewport()) {
		resetCoverAnimation()
		if (url !== shownCover.value) shownCover.value = ''
		return
	}
	await updateCover()
})
onMounted(() => {
	observer = new IntersectionObserver(
		(entries) => {
			visible.value = entries.some(
				(entry) =>
					entry.isIntersecting &&
					entry.intersectionRect.width > 0 &&
					entry.intersectionRect.height > 0,
			)
		},
		{ rootMargin: '0px' },
	)
	if (frame.value) observer.observe(frame.value)
})
onBeforeUnmount(() => {
	revision++
	observer?.disconnect()
	resetCoverAnimation()
	decodingImage?.removeAttribute('src')
	decodingImage = null
	cancelAnimationFrame(revealFrame)
	cancelAnimationFrame(revealNextFrame)
})
</script>

<style scoped>
.bangumi-cover {
	opacity: 1;
	filter: blur(0);
	transform: translateY(0);
	transition:
		opacity 600ms ease,
		filter 600ms ease,
		transform 600ms cubic-bezier(0.22, 1, 0.36, 1);
}
.bangumi-cover-covered {
	opacity: 0;
	filter: blur(4px);
	transform: translateY(24px);
	transition: none;
}
.bangumi-cover-previous {
	animation: bangumi-cover-soften 600ms ease both;
}
@keyframes bangumi-cover-soften {
	from {
		filter: blur(0);
	}
	to {
		filter: blur(2px);
	}
}
.bangumi-title-enter-active,
.bangumi-title-leave-active {
	transition:
		opacity 280ms ease,
		filter 280ms ease,
		transform 280ms ease;
}
.bangumi-title-enter-from {
	opacity: 0;
	filter: blur(4px);
	transform: translateY(6px);
}
.bangumi-title-leave-to {
	opacity: 0;
	filter: blur(4px);
	transform: translateY(-6px);
}
.bangumi-badge-enter-active,
.bangumi-badge-leave-active {
	transition:
		opacity 220ms ease,
		transform 220ms ease;
}
.bangumi-badge-enter-from {
	opacity: 0;
	transform: translateY(4px);
}
.bangumi-badge-leave-to {
	opacity: 0;
	transform: translateY(-4px);
}
@media (prefers-reduced-motion: reduce) {
	.bangumi-cover-previous {
		animation: none;
	}
	.bangumi-cover,
	.bangumi-title-enter-active,
	.bangumi-title-leave-active,
	.bangumi-badge-enter-active,
	.bangumi-badge-leave-active {
		transition: none;
	}
	.bangumi-title-enter-from,
	.bangumi-title-leave-to {
		filter: none;
		transform: none;
	}
}
</style>
