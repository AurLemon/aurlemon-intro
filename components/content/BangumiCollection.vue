<template>
	<section
		ref="collectionRoot"
		class="bangumi-collection relative my-4 min-w-0 font-serif font-normal"
	>
		<div v-if="isLoading" class="space-y-3 animate-pulse" aria-busy="true">
			<div class="flex gap-4 overflow-hidden">
				<div v-for="card in 6" :key="card" class="w-40 shrink-0 space-y-2">
					<USkeleton class="aspect-[5/7] w-full rounded-lg" />
					<USkeleton class="h-4 w-full rounded-md" />
				</div>
			</div>
		</div>
		<Transition v-else name="bangumi-fade" mode="out-in">
			<div
				v-if="error"
				key="error"
				class="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-600 dark:border-rose-700/60 dark:bg-rose-900/20 dark:text-rose-300"
			>
				<p class="mb-2">{{ t('main.preference.bangumiLoadFailed') }}</p>
				<UButton
					size="xs"
					variant="soft"
					color="neutral"
					:loading="retryPending[activeType]"
					@click="refreshCategory(activeType)"
					>{{ t('main.preference.bangumiRetry') }}</UButton
				>
			</div>
			<div v-else-if="section" key="collection">
				<HorizontalScroller
					v-if="section.items.length"
					ref="scroller"
					snap
					fade-edges
					compact-swipe-only
					item-selector="[data-bangumi-card]"
				>
					<div class="flex gap-4 pb-1">
						<BangumiWorkCard
							v-for="(item, slotIndex) in section.items"
							:key="slotIndex"
							:item="item"
							:status="resolveBadgeLabel(item.collectionType)"
						/>
					</div>
				</HorizontalScroller>
				<div v-else class="text-sm text-slate-500">
					{{ t('main.preference.bangumiEmpty') }}
				</div>
			</div>
		</Transition>
		<div
			class="bangumi-footer mt-3 grid items-start gap-x-3 gap-y-3.5 font-sans text-sm font-normal text-slate-600 dark:text-slate-300"
		>
			<div class="flex min-w-0 items-center gap-2">
				<div
					ref="categoryRow"
					class="flex w-max max-w-full items-center -translate-y-px"
				>
					<div
						class="inline-flex h-5 items-center gap-0.5 rounded bg-(--color-surface-2) p-px"
						:aria-label="t('main.preference.bangumiCategory')"
					>
						<button
							v-for="category in categories"
							:key="category"
							type="button"
							:aria-pressed="activeType === category"
							class="rounded-xs px-1.5 py-0 text-xs leading-4.5 transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-primary motion-reduce:transition-none"
							:class="
								activeType === category
									? 'bg-(--color-surface-0) text-slate-800 shadow-xs dark:text-slate-100'
									: 'hover:text-slate-800 dark:hover:text-slate-100'
							"
							@click="selectCategory(category)"
						>
							{{
								t(
									`main.preference.${category === 'anime' ? 'bangumiAnimeTab' : 'bangumiBooksTab'}`,
								)
							}}
						</button>
					</div>
				</div>
				<div
					v-if="section && !isLoading && !error"
					class="inline-flex max-w-full items-start gap-1.5 text-sm tabular-nums transition-[width] duration-400 ease-in-out motion-reduce:transition-none"
					:style="{
						width: statsWidth === null ? undefined : `${statsWidth}px`,
						height: `${statsHeight}px`,
					}"
				>
					<TransitionGroup
						name="bangumi-stats"
						@before-leave="freezeStatsWidth"
						tag="div"
						class="relative grid shrink-0"
						:style="{
							width: statsWidth === null ? undefined : `${statsWidth}px`,
						}"
					>
						<span
							:key="activeType"
							class="flex min-h-5 min-w-0 flex-wrap content-start gap-x-1.5 gap-y-1 [grid-area:1/1]"
							aria-live="polite"
						>
							<span
								v-for="(stat, index) in summaryParts"
								:key="index"
								class="whitespace-nowrap"
							>
								{{ stat
								}}<span v-if="index < summaryParts.length - 1" class="ml-1.5"
									>/</span
								>
							</span>
						</span>
					</TransitionGroup>
				</div>
			</div>
			<div ref="accountRow" class="bangumi-account sm:justify-self-end">
				<NuxtLink
					:to="profileUrl"
					target="_blank"
					rel="noopener noreferrer"
					class="group/bangumi inline-flex items-center gap-1.5 ml-1 sm:ml-0"
				>
					<BangumiLogo aria-hidden="true" class="h-[17px] w-auto shrink-0" />
					<span
						class="transition-colors group-hover/bangumi:text-slate-800 dark:group-hover/bangumi:text-slate-100"
						>@{{ section?.username || 'aurlemon' }}</span
					>
				</NuxtLink>
			</div>
		</div>
		<div
			aria-hidden="true"
			class="pointer-events-none invisible absolute inset-0 overflow-hidden"
		>
			<span
				v-for="category in categories"
				:key="category"
				:data-stats-category="category"
				aria-hidden="true"
				class="flex w-max flex-wrap gap-x-1.5 gap-y-1 font-sans text-sm font-normal tabular-nums"
				:style="{ maxWidth: `${statsAvailableWidth}px` }"
			>
				<span
					v-for="(stat, index) in getSummaryParts(category)"
					:key="index"
					class="whitespace-nowrap"
					>{{ stat
					}}<span
						v-if="index < getSummaryParts(category).length - 1"
						class="ml-1.5"
						>/</span
					></span
				>
			</span>
		</div>
	</section>
</template>

<script setup lang="ts">
import BangumiLogo from '~/assets/icons/bangumi.svg'
import type {
	BangumiCollectionType,
	BangumiSectionResponse,
} from '~/shared/types/bangumi'
interface Props {
	type?: 'anime' | 'books'
}
interface ScrollerHandle {
	viewport: HTMLElement | null
	updateEdges: () => void
}
const props = withDefaults(defineProps<Props>(), { type: 'anime' })
const activeType = ref<'anime' | 'books'>(props.type)
const { t } = useI18n({ useScope: 'global' })
type Category = 'anime' | 'books'
interface CategoryResult {
	section: BangumiSectionResponse | null
	failed: boolean
}
const categories = ['anime', 'books'] as const
const fetchCategory = (type: Category) =>
	$fetch<BangumiSectionResponse>(`/api/bangumi/${type}`)
const { data, error: libraryError } = useLazyAsyncData(
	'bangumi-library',
	async () => {
		const results = await Promise.allSettled(categories.map(fetchCategory))
		const resultAt = (index: number): CategoryResult => {
			const result = results[index]
			return result?.status === 'fulfilled'
				? { section: result.value, failed: false }
				: { section: null, failed: true }
		}
		return { anime: resultAt(0), books: resultAt(1) }
	},
)
const retryPending = reactive<Record<Category, boolean>>({
	anime: false,
	books: false,
})
let disposed = false
const refreshCategory = async (type: Category) => {
	if (retryPending[type]) return
	retryPending[type] = true
	try {
		let result: CategoryResult
		try {
			result = { section: await fetchCategory(type), failed: false }
		} catch {
			result = { section: null, failed: true }
		}
		if (disposed) return
		data.value = {
			anime: data.value?.anime ?? { section: null, failed: false },
			books: data.value?.books ?? { section: null, failed: false },
			[type]: result,
		}
	} finally {
		retryPending[type] = false
	}
}
const section = computed(() => data.value?.[activeType.value].section)
const error = computed(
	() => libraryError.value || data.value?.[activeType.value].failed,
)
const labelPrefix = computed(() =>
	activeType.value === 'anime' ? 'bangumiAnime' : 'bangumiBooks',
)
const scrollPositions = { anime: 0, books: 0 }
const selectCategory = async (type: 'anime' | 'books') => {
	if (activeType.value === type) return
	scrollPositions[activeType.value] = scroller.value?.viewport?.scrollLeft ?? 0
	activeType.value = type
	await nextTick()
	scroller.value?.viewport?.scrollTo({
		left: scrollPositions[type],
		behavior: 'instant',
	})
	scroller.value?.updateEdges()
}
const isPlaceholder = computed(() =>
	categories.some((type) => data.value?.[type].section?.isPlaceholder === true),
)
const isLoading = computed(
	() =>
		!error.value && (!section.value || section.value.isPlaceholder === true),
)
const scroller = ref<ScrollerHandle | null>(null)
// An error-to-content transition mounts the scroller after selectCategory's tick.
watch(scroller, async (value) => {
	if (!value) return
	await nextTick()
	if (value !== scroller.value) return
	value.viewport?.scrollTo({
		left: scrollPositions[activeType.value],
		behavior: 'instant',
	})
	value.updateEdges()
})
watch(section, async () => {
	await nextTick()
	scroller.value?.updateEdges()
})

const getSummaryParts = (type: 'anime' | 'books'): string[] => {
	const source = data.value?.[type].section
	return t(
		`main.preference.${type === 'anime' ? 'bangumiAnime' : 'bangumiBooks'}Summary`,
		{
			doing:
				source?.items.filter((item) => item.collectionType === 3).length ?? 0,
			wish: source?.wishCount ?? 0,
			done: source?.doneCount ?? 0,
		},
	).split(' / ')
}
const summaryParts = computed(() => getSummaryParts(activeType.value))
const collectionRoot = ref<HTMLElement | null>(null)
const statsWidth = ref<number | null>(null)
const statsHeight = ref(20)
const accountRow = ref<HTMLElement | null>(null)
const categoryRow = ref<HTMLElement | null>(null)
const statsAvailableWidth = ref(1000)
const freezeStatsWidth = (element: Element) => {
	if (element instanceof HTMLElement)
		element.style.width = `${element.getBoundingClientRect().width}px`
}
let statsObserver: ResizeObserver | undefined
onMounted(() => {
	statsObserver = new ResizeObserver(() => {
		const width = collectionRoot.value?.clientWidth ?? 0
		const accountWidth = accountRow.value?.getBoundingClientRect().width ?? 0
		statsAvailableWidth.value = Math.max(
			0,
			width -
				(categoryRow.value?.getBoundingClientRect().width ?? 0) -
				12 -
				(width >= 672 ? accountWidth + 12 : 0),
		)
		const measures = collectionRoot.value?.querySelectorAll<HTMLElement>(
			'[data-stats-category]',
		)
		if (!measures?.length) return
		statsHeight.value = Math.max(
			20,
			...Array.from(
				measures,
				(element) => element.getBoundingClientRect().height,
			),
		)
		const current = Array.from(measures).find(
			(element) => element.dataset.statsCategory === activeType.value,
		)
		if (current) statsWidth.value = current.getBoundingClientRect().width
	})
	for (const element of collectionRoot.value?.querySelectorAll<HTMLElement>(
		'[data-stats-category]',
	) ?? [])
		statsObserver.observe(element)
	if (collectionRoot.value) statsObserver.observe(collectionRoot.value)
	if (accountRow.value) statsObserver.observe(accountRow.value)
	if (categoryRow.value) statsObserver.observe(categoryRow.value)
})
watch(activeType, async () => {
	await nextTick()
	const current = collectionRoot.value?.querySelector<HTMLElement>(
		`[data-stats-category="${activeType.value}"]`,
	)
	if (current) statsWidth.value = current.getBoundingClientRect().width
})
const profileUrl = computed(
	() =>
		section.value?.profileUrl ||
		`https://bgm.tv/user/${encodeURIComponent(section.value?.username || 'aurlemon')}`,
)
const resolveBadgeLabel = (collectionType: BangumiCollectionType): string =>
	t(
		`main.preference.${labelPrefix.value}Status${collectionType === 1 ? 'Wish' : collectionType === 2 ? 'Done' : 'Doing'}`,
	)
let placeholderRefreshTimer: ReturnType<typeof setInterval> | undefined
watch(
	isPlaceholder,
	(value) => {
		if (!import.meta.client) return
		if (value && !placeholderRefreshTimer) {
			placeholderRefreshTimer = setInterval(() => {
				for (const type of categories) {
					if (data.value?.[type].section?.isPlaceholder)
						void refreshCategory(type)
				}
			}, 8000)
		} else if (!value && placeholderRefreshTimer) {
			clearInterval(placeholderRefreshTimer)
			placeholderRefreshTimer = undefined
		}
	},
	{ immediate: true },
)
onBeforeUnmount(() => {
	disposed = true
	statsObserver?.disconnect()
	if (placeholderRefreshTimer) clearInterval(placeholderRefreshTimer)
})
</script>

<style scoped>
.bangumi-collection {
	container-type: inline-size;
}
.bangumi-footer {
	grid-template-columns: minmax(0, 1fr) auto;
}
@container (max-width: 671px) {
	.bangumi-footer {
		grid-template-columns: minmax(0, 1fr);
	}
}

.bangumi-stats-enter-active,
.bangumi-stats-leave-active {
	transition:
		opacity 260ms ease,
		filter 260ms ease,
		transform 260ms ease;
}
.bangumi-stats-leave-active {
	position: absolute;
	width: 100%;
}
.bangumi-stats-enter-from,
.bangumi-stats-leave-to {
	opacity: 0;
	filter: blur(4px);
	transform: translateY(2px);
}

.bangumi-fade-enter-active,
.bangumi-fade-leave-active {
	transition: opacity 180ms ease;
}
.bangumi-fade-enter-from,
.bangumi-fade-leave-to {
	opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
	.bangumi-stats-enter-active,
	.bangumi-stats-leave-active {
		transition: none;
	}
	.bangumi-stats-enter-from,
	.bangumi-stats-leave-to {
		filter: none;
		transform: none;
	}
	.bangumi-fade-enter-active,
	.bangumi-fade-leave-active {
		transition: none;
	}
}
</style>
