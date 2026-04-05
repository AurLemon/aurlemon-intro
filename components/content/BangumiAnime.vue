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
					:key="`anime-skeleton-card-${card}`"
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
							{{ t('main.preference.bangumiAnimeTitle') }}
						</p>
						<p
							class="font-(family-name:--font-family) text-lg font-semibold text-slate-900 dark:text-slate-100"
						>
							{{
								t('main.preference.bangumiAnimeSummary', {
									doing: animeDoingCount,
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
					class="grid grid-flow-col auto-cols-[130px] gap-1 overflow-x-auto pb-1"
				>
					<a
						v-for="item in section.items"
						:key="`anime-${item.subjectId}-${item.collectionType}`"
						:href="item.url"
						target="_blank"
						rel="noopener noreferrer"
						class="w-full rounded-xl p-2 transition-colors hover:bg-slate-200/50 dark:hover:bg-slate-800/70"
					>
						<div class="relative">
							<UBadge
								class="absolute left-1 top-1 z-10 !bg-slate-100/90 !text-slate-700 backdrop-blur-sm dark:!bg-slate-800/90 dark:!text-slate-200 font-(family-name:--font-family)"
								size="sm"
								color="neutral"
								variant="soft"
							>
								{{ resolveAnimeBadgeLabel(item.collectionType) }}
							</UBadge>

							<img
								v-if="item.coverUrl"
								:src="item.coverUrl"
								:alt="item.name"
								class="h-40 w-30 rounded-lg object-cover"
								loading="lazy"
								decoding="async"
								referrerpolicy="no-referrer"
							/>
							<div
								v-else
								class="flex h-40 w-30 items-center justify-center rounded-lg bg-slate-100 text-slate-400 dark:bg-slate-800"
							>
								<UIcon name="i-lucide-image-off" class="size-4" />
							</div>
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
	'bangumi-anime',
	() => $fetch<BangumiSectionResponse>('/api/bangumi/anime'),
)

const section = computed<BangumiSectionResponse>(() => {
	return (
		data.value ?? {
			type: 'anime',
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
const animeDoingCount = computed(() => {
	return section.value.items.reduce(
		(total, item) => total + (item.collectionType === 3 ? 1 : 0),
		0,
	)
})

const resolveAnimeBadgeLabel = (collectionType: number): string => {
	if (collectionType === 1) {
		return t('main.preference.bangumiAnimeStatusWish')
	}
	if (collectionType === 2) {
		return t('main.preference.bangumiAnimeStatusDone')
	}
	return t('main.preference.bangumiAnimeStatusDoing')
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
