<template>
	<section
		class="my-4 rounded-2xl border border-slate-200/80 p-4 dark:border-slate-700/80"
	>
		<div v-if="isLoading" class="space-y-3 animate-pulse">
			<div class="flex items-start justify-between gap-3">
				<div class="space-y-2">
					<USkeleton
						class="h-3 w-28 rounded-md bg-slate-200 dark:bg-slate-700"
					/>
					<USkeleton
						class="h-6 w-64 rounded-md bg-slate-200 dark:bg-slate-700"
					/>
				</div>
				<USkeleton class="h-6 w-20 rounded-md bg-slate-200 dark:bg-slate-700" />
			</div>

			<div
				class="grid grid-flow-col auto-cols-[130px] gap-1 overflow-x-auto pb-1"
			>
				<div
					v-for="card in 8"
					:key="`books-skeleton-card-${card}`"
					class="space-y-2"
				>
					<USkeleton
						class="h-40 w-30 rounded-lg bg-slate-200 dark:bg-slate-700"
					/>
					<USkeleton
						class="h-4 w-30 rounded-md bg-slate-200 dark:bg-slate-700"
					/>
					<USkeleton
						class="h-4 w-20 rounded-md bg-slate-200 dark:bg-slate-700"
					/>
				</div>
			</div>
		</div>

		<Transition v-else name="contrib-fade" mode="out-in">
			<div
				v-if="error"
				class="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-600 dark:border-rose-700/60 dark:bg-rose-900/20 dark:text-rose-300"
			>
				<p class="mb-2">{{ t('main.preference.bangumiLoadFailed') }}</p>
				<UButton size="xs" variant="soft" color="neutral" @click="refresh()">
					{{ t('main.preference.bangumiRetry') }}
				</UButton>
			</div>

			<div v-else class="space-y-3">
				<div class="flex items-start justify-between gap-3">
					<div>
						<p class="mb-0.5 text-xs text-slate-500 dark:text-slate-400">
							{{ t('main.preference.bangumiBooksTitle') }}
						</p>
						<p
							class="font-(family-name:--font-family) text-lg font-semibold text-slate-900 dark:text-slate-100"
						>
							{{
								t('main.preference.bangumiBooksSummary', {
									doing: booksDoingCount,
									wish: section.wishCount,
									done: section.doneCount,
								})
							}}
						</p>
					</div>
					<UButton
						class="font-mono"
						to="https://bgm.tv/user/aurlemon"
						target="_blank"
						variant="link"
						color="neutral"
						size="xs"
					>
						@aurlemon
					</UButton>
				</div>

				<div v-if="section.items.length === 0" class="text-sm text-slate-500">
					{{ t('main.preference.bangumiEmpty') }}
				</div>

				<div
					v-else
					ref="cardsScrollRef"
					class="grid grid-flow-col auto-cols-[130px] gap-1 overflow-x-auto pb-1"
				>
					<a
						v-for="item in section.items"
						:key="`books-${item.subjectId}-${item.collectionType}`"
						:href="item.url"
						:data-card-key="getItemKey(item)"
						:ref="(el) => setCardRef(el, getItemKey(item))"
						target="_blank"
						rel="noopener noreferrer"
						class="w-full rounded-xl p-2 transition-colors hover:bg-slate-200/50 dark:hover:bg-slate-800/70"
					>
						<div class="relative h-40 w-30">
							<UBadge
								class="absolute left-1 top-1 z-10 !bg-slate-100/90 !text-slate-700 backdrop-blur-sm dark:!bg-slate-800/90 dark:!text-slate-200 font-(family-name:--font-family)"
								size="sm"
								color="neutral"
								variant="soft"
							>
								{{ resolveBooksBadgeLabel(item.collectionType) }}
							</UBadge>

							<USkeleton
								v-if="
									!item.coverUrl ||
									hasImageError(getItemKey(item)) ||
									!isImageLoaded(getItemKey(item))
								"
								class="absolute inset-0 rounded-lg bg-slate-200 dark:bg-slate-700"
							/>
							<img
								v-if="
									item.coverUrl &&
									shouldLoadImage(getItemKey(item)) &&
									!hasImageError(getItemKey(item))
								"
								:src="item.coverUrl"
								:alt="item.name"
								class="absolute inset-0 h-full w-full rounded-lg object-cover transition-opacity duration-200"
								:class="
									isImageLoaded(getItemKey(item)) ? 'opacity-100' : 'opacity-0'
								"
								loading="lazy"
								decoding="async"
								referrerpolicy="no-referrer"
								@load="markImageLoaded(getItemKey(item))"
								@error="markImageError(getItemKey(item))"
							/>
						</div>
						<p
							class="mt-2 line-clamp-2 text-sm text-slate-700 dark:text-slate-200"
						>
							{{ item.name }}
						</p>
					</a>
				</div>
			</div>
		</Transition>
	</section>
</template>

<script setup lang="ts">
import type { BangumiSectionResponse } from '~/shared/types/bangumi'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const { data, pending, error, refresh } = useLazyAsyncData(
	'bangumi-books',
	() => $fetch<BangumiSectionResponse>('/api/bangumi/books'),
)

const section = computed<BangumiSectionResponse>(() => {
	return (
		data.value ?? {
			type: 'books',
			generatedAt: '',
			username: '',
			profileUrl: '',
			wishCount: 0,
			doneCount: 0,
			items: [],
			isPlaceholder: true,
		}
	)
})

const isPlaceholder = computed(() => section.value.isPlaceholder === true)
const isLoading = computed(
	() => pending.value || !data.value || isPlaceholder.value,
)
const cardsScrollRef = ref<HTMLElement | null>(null)
const cardElements = new Map<string, HTMLElement>()
const imageVisibleState = reactive<Record<string, boolean>>({})
const imageLoadedState = reactive<Record<string, boolean>>({})
const imageErrorState = reactive<Record<string, boolean>>({})
let cardVisibilityObserver: IntersectionObserver | undefined

const getItemKey = (item: {
	subjectId: number
	collectionType: number
}): string => {
	return `${item.subjectId}-${item.collectionType}`
}

const shouldLoadImage = (key: string): boolean => {
	return imageVisibleState[key] === true
}

const isImageLoaded = (key: string): boolean => {
	return imageLoadedState[key] === true
}

const hasImageError = (key: string): boolean => {
	return imageErrorState[key] === true
}

const markImageLoaded = (key: string): void => {
	imageLoadedState[key] = true
}

const markImageError = (key: string): void => {
	imageErrorState[key] = true
}

const setCardRef = (el: unknown, key: string): void => {
	const previous = cardElements.get(key)
	if (previous && previous !== el) {
		cardVisibilityObserver?.unobserve(previous)
		cardElements.delete(key)
	}

	if (el instanceof HTMLElement) {
		cardElements.set(key, el)
		if (!shouldLoadImage(key)) {
			cardVisibilityObserver?.observe(el)
		}
	}
}

const resetImageState = (keys: Set<string>): void => {
	for (const state of [imageVisibleState, imageLoadedState, imageErrorState]) {
		for (const key of Object.keys(state)) {
			if (!keys.has(key)) {
				state[key] = false
			}
		}
	}

	for (const [key, element] of cardElements.entries()) {
		if (!keys.has(key)) {
			cardVisibilityObserver?.unobserve(element)
			cardElements.delete(key)
		}
	}
}

const initCardVisibilityObserver = (): void => {
	if (!import.meta.client) {
		return
	}

	cardVisibilityObserver?.disconnect()

	if (!cardsScrollRef.value) {
		cardVisibilityObserver = undefined
		return
	}

	cardVisibilityObserver = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (!entry.isIntersecting) {
					continue
				}

				const key = (entry.target as HTMLElement).dataset.cardKey
				if (!key) {
					continue
				}

				imageVisibleState[key] = true
				cardVisibilityObserver?.unobserve(entry.target)
			}
		},
		{
			root: cardsScrollRef.value,
			rootMargin: '0px 120px 0px 120px',
			threshold: 0.01,
		},
	)

	for (const [key, element] of cardElements.entries()) {
		if (!shouldLoadImage(key)) {
			cardVisibilityObserver.observe(element)
		}
	}
}

watch(
	() => section.value.items,
	(items) => {
		const keys = new Set(items.map((item) => getItemKey(item)))
		resetImageState(keys)
		void nextTick().then(() => {
			initCardVisibilityObserver()
		})
	},
	{ immediate: true },
)

watch(cardsScrollRef, () => {
	void nextTick().then(() => {
		initCardVisibilityObserver()
	})
})

onMounted(() => {
	initCardVisibilityObserver()
})

const booksDoingCount = computed(() => {
	return section.value.items.reduce(
		(total, item) => total + (item.collectionType === 3 ? 1 : 0),
		0,
	)
})

const resolveBooksBadgeLabel = (collectionType: number): string => {
	if (collectionType === 1) {
		return t('main.preference.bangumiBooksStatusWish')
	}
	if (collectionType === 2) {
		return t('main.preference.bangumiBooksStatusDone')
	}
	return t('main.preference.bangumiBooksStatusDoing')
}

let placeholderRefreshTimer: ReturnType<typeof setInterval> | undefined

watch(
	isPlaceholder,
	(value) => {
		if (!import.meta.client) {
			return
		}
		if (value) {
			if (!placeholderRefreshTimer) {
				placeholderRefreshTimer = setInterval(() => {
					void refresh()
				}, 8000)
			}
			return
		}
		if (placeholderRefreshTimer) {
			clearInterval(placeholderRefreshTimer)
			placeholderRefreshTimer = undefined
		}
	},
	{ immediate: true },
)

onBeforeUnmount(() => {
	if (placeholderRefreshTimer) {
		clearInterval(placeholderRefreshTimer)
		placeholderRefreshTimer = undefined
	}
	cardVisibilityObserver?.disconnect()
	cardVisibilityObserver = undefined
	cardElements.clear()
})
</script>

<style scoped>
.contrib-fade-enter-active,
.contrib-fade-leave-active {
	transition: opacity 180ms ease;
}

.contrib-fade-enter-from,
.contrib-fade-leave-to {
	opacity: 0;
}
</style>
