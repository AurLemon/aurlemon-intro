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
			<div class="space-y-4">
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
								<p class="truncate text-sm font-mono">
									{{ item.maskedFingerprint }}
								</p>
								<p
									class="text-xs text-slate-500 dark:text-slate-400 sm:shrink-0"
								>
									{{ formatTime(item.likedAt) }}
								</p>
							</div>
						</div>
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
const listRef = ref<HTMLElement | null>(null)

const formatTime = (value: string) => dayjs(value).format('YYYY-MM-DD HH:mm')

const loadItems = async () => {
	loading.value = true

	try {
		const response = await $fetch<SiteLikeListResponse>('/api/site-like/list')
		items.value = response.items
	} catch (error) {
		showError(error)
	} finally {
		loading.value = false
	}
}

watch(open, async (value) => {
	if (!value) {
		return
	}

	await loadItems()
	await nextTick()
	listRef.value?.scrollTo({
		top: 0,
	})
})
</script>
