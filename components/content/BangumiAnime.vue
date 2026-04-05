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
						class="h-6 w-36 rounded-md bg-slate-200 dark:bg-slate-700"
					/>
				</div>
				<div class="flex gap-2">
					<USkeleton
						class="h-6 w-16 rounded-full bg-slate-200 dark:bg-slate-700"
					/>
					<USkeleton
						class="h-6 w-16 rounded-full bg-slate-200 dark:bg-slate-700"
					/>
				</div>
			</div>

			<div class="max-h-80 space-y-2 overflow-y-auto pr-1">
				<div
					v-for="row in 6"
					:key="`anime-skeleton-row-${row}`"
					class="flex items-center gap-3 rounded-xl border border-slate-100 p-2 dark:border-slate-800"
				>
					<USkeleton
						class="h-14 w-10 rounded-md bg-slate-200 dark:bg-slate-700"
					/>
					<USkeleton
						class="h-4 flex-1 rounded-md bg-slate-200 dark:bg-slate-700"
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
							Bangumi
						</p>
						<p
							class="font-(family-name:--font-family) text-xl font-semibold text-slate-900 dark:text-slate-100"
						>
							{{ t('main.preference.bangumiAnimeTitle') }}
						</p>
					</div>
					<div class="flex gap-2">
						<span
							class="rounded-full bg-slate-100 px-2 py-1 text-xs tabular-nums text-slate-700 dark:bg-slate-800 dark:text-slate-200"
						>
							{{
								t('main.preference.bangumiWishCount', {
									count: section.wishCount,
								})
							}}
						</span>
						<span
							class="rounded-full bg-slate-100 px-2 py-1 text-xs tabular-nums text-slate-700 dark:bg-slate-800 dark:text-slate-200"
						>
							{{
								t('main.preference.bangumiDoneCount', {
									count: section.doneCount,
								})
							}}
						</span>
					</div>
				</div>

				<div v-if="section.items.length === 0" class="text-sm text-slate-500">
					{{ t('main.preference.bangumiEmpty') }}
				</div>

				<div v-else class="max-h-80 space-y-2 overflow-y-auto pr-1">
					<a
						v-for="item in section.items"
						:key="`anime-${item.subjectId}-${item.collectionType}`"
						:href="item.url"
						target="_blank"
						rel="noopener noreferrer"
						class="flex items-center gap-3 rounded-xl border border-slate-100 p-2 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900/60"
					>
						<img
							v-if="item.coverUrl"
							:src="item.coverUrl"
							:alt="item.name"
							class="h-14 w-10 shrink-0 rounded-md object-cover"
							loading="lazy"
							decoding="async"
							referrerpolicy="no-referrer"
						/>
						<div
							v-else
							class="flex h-14 w-10 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-400 dark:bg-slate-800"
						>
							<UIcon name="i-lucide-image-off" class="size-4" />
						</div>
						<p class="line-clamp-2 text-sm text-slate-700 dark:text-slate-200">
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
