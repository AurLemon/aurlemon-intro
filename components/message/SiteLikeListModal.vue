<template>
	<UModal
		v-model:open="open"
		:title="t('social.siteLike.listTitle')"
		class="max-w-lg"
		scrollable
		:ui="{
			overlay: 'z-[43100]',
			content: 'z-[43110]',
		}"
	>
		<template #body>
			<div
				:style="contentWrapperStyle"
				:class="
					animateHeight
						? 'overflow-hidden transition-[height] duration-300 ease-out'
						: 'overflow-hidden transition-none'
				"
			>
				<div ref="contentRef" class="space-y-4">
					<UAlert
						v-if="!loading && !items.length"
						color="neutral"
						variant="soft"
						:title="t('social.siteLike.emptyTitle')"
						:description="t('social.siteLike.emptyDesc')"
					/>
					<div
						v-else
						ref="listRef"
						class="space-y-2 max-h-[60vh] overflow-y-auto pr-1"
					>
						<div v-for="item in items" :key="item.likeId" class="">
							<div class="flex items-center gap-3">
								<UIcon
									name="i-lucide-heart"
									class="h-4 w-4 shrink-0 text-red-500"
								/>
								<div
									class="min-w-0 flex-1 flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
								>
									<div
										class="min-w-0 flex items-center gap-x-2 flex-wrap sm:flex-nowrap"
									>
										<p class="truncate text-sm font-mono">
											{{ item.maskedFingerprint }}
										</p>
										<UBadge
											v-if="item.ipRegionLabel"
											color="neutral"
											variant="soft"
											size="sm"
											class="max-w-full truncate"
										>
											{{ item.ipRegionLabel }}
										</UBadge>
										<UBadge
											v-if="item.ipVersion"
											color="primary"
											variant="soft"
											size="sm"
										>
											{{ item.ipVersion === 4 ? 'IPv4' : 'IPv6' }}
										</UBadge>
									</div>
									<p
										class="text-xs text-slate-500 dark:text-slate-400 sm:shrink-0"
									>
										{{ formatTime(item.likedAt) }}
									</p>
								</div>
							</div>
						</div>
					</div>
					<div
						v-if="pagination.totalPages > 1"
						class="flex items-center justify-end gap-2"
					>
						<UButton
							size="xs"
							color="neutral"
							variant="ghost"
							:disabled="loading || !pagination.hasPrev"
							@click="goPrevPage"
						>
							{{ t('social.actions.prevPage') }}
						</UButton>
						<span class="text-xs text-slate-500 dark:text-slate-400">
							{{
								t('social.message.pageInfo', {
									page: pagination.page,
									total: pagination.totalPages,
								})
							}}
						</span>
						<UButton
							size="xs"
							color="neutral"
							variant="ghost"
							:disabled="loading || !pagination.hasNext"
							@click="goNextPage"
						>
							{{ t('social.actions.nextPage') }}
						</UButton>
					</div>
				</div>
			</div>
		</template>
	</UModal>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import type {
	SiteLikeListItem,
	SiteLikeListResponse,
} from '~/shared/types/social'

const open = defineModel<boolean>('open', { default: false })

const { t } = useI18n()
const { showError } = useSocialFeedback()

const items = ref<SiteLikeListItem[]>([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = 20
const contentHeight = ref<number | null>(null)
const animateHeight = ref(false)
const pagination = ref<SiteLikeListResponse['pagination']>({
	page: 1,
	pageSize,
	totalPages: 1,
	totalCount: 0,
	hasPrev: false,
	hasNext: false,
})
const listRef = ref<HTMLElement | null>(null)
const contentRef = ref<HTMLElement | null>(null)

const contentWrapperStyle = computed(() => ({
	height: contentHeight.value === null ? 'auto' : `${contentHeight.value}px`,
}))

const formatTime = (value: string) => dayjs(value).format('YYYY-MM-DD HH:mm')

const updateContentHeight = () => {
	const element = contentRef.value

	if (!element) {
		return
	}

	contentHeight.value = element.offsetHeight
}

const loadItems = async () => {
	loading.value = true

	try {
		const response = await $fetch<SiteLikeListResponse>('/api/site-like/list', {
			query: {
				page: currentPage.value,
				pageSize,
			},
		})
		items.value = response.items
		pagination.value = response.pagination
		currentPage.value = response.pagination.page
		await nextTick()
		updateContentHeight()
		if (animateHeight.value) {
			await nextTick()
		}
		listRef.value?.scrollTo({
			top: 0,
			behavior: 'smooth',
		})
	} catch (error) {
		showError(error)
	} finally {
		loading.value = false
	}
}

const goPrevPage = () => {
	if (!pagination.value.hasPrev || loading.value) {
		return
	}

	currentPage.value -= 1
	void loadItems()
}

const goNextPage = () => {
	if (!pagination.value.hasNext || loading.value) {
		return
	}

	currentPage.value += 1
	void loadItems()
}

watch(open, async (value) => {
	if (!value) {
		return
	}

	animateHeight.value = false
	contentHeight.value = null
	currentPage.value = 1
	await loadItems()
	await nextTick()
	if (import.meta.client) {
		requestAnimationFrame(() => {
			animateHeight.value = true
		})
	}
})
</script>
