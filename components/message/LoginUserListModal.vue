<template>
	<UModal
		v-model:open="open"
		:title="t('social.loginUsers.listTitle')"
		class="max-w-md"
		scrollable
		:ui="{ overlay: 'z-[43100]', content: 'z-[43110]' }"
	>
		<template #body>
			<AnimatedModalBody>
				<div class="space-y-4">
					<UAlert
						v-if="!loading && !items.length"
						color="neutral"
						variant="soft"
						:title="t('social.loginUsers.emptyTitle')"
						:description="t('social.loginUsers.emptyDesc')"
					/>
					<div v-else class="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
						<div
							v-for="item in items"
							:key="item.id"
							class="flex items-center gap-3 rounded-xl p-2"
						>
							<SkeletonImage
								v-if="item.avatarUrl"
								:src="item.avatarUrl"
								:alt="item.displayUsername"
								class="h-8 w-8 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800"
								:image-class="
									[
										'h-full w-full object-cover',
										!item.canViewDetails ? 'blur-sm' : '',
									].join(' ')
								"
								skeleton-class="rounded-full"
							/>
							<div
								v-else
								class="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800"
							>
								<UIcon
									name="i-lucide-user-round"
									class="h-4 w-4 text-slate-500"
								/>
							</div>
							<div class="min-w-0 flex-1">
								<p class="truncate text-sm font-semibold">
									@{{ item.displayUsername }}
								</p>
								<p class="text-xs text-slate-500">
									{{ formatTime(item.createdAt) }}
								</p>
							</div>
							<div class="flex items-center gap-2">
								<UButton
									v-if="getIdentityProfileUrl(item, 'GITHUB')"
									size="xs"
									color="neutral"
									class="p-0"
									variant="link"
									:to="getIdentityProfileUrl(item, 'GITHUB')"
									target="_blank"
									aria-label="GitHub"
									title="GitHub"
								>
									<UIcon name="i-lucide-github" class="h-5 w-5" />
								</UButton>
								<UIcon
									v-else-if="item.providers.includes('GITHUB')"
									name="i-lucide-github"
									class="h-5 w-5"
								/>
								<UButton
									v-if="getIdentityProfileUrl(item, 'LINUX_DO')"
									size="xs"
									color="neutral"
									class="p-0"
									variant="link"
									:to="getIdentityProfileUrl(item, 'LINUX_DO')"
									target="_blank"
									aria-label="Linux DO"
									title="Linux DO"
								>
									<LinuxDoIcon class="h-5 w-5" />
								</UButton>
								<LinuxDoIcon
									v-else-if="item.providers.includes('LINUX_DO')"
									class="h-5 w-5"
								/>
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
							@click="changePage(-1)"
							>{{ t('social.actions.prevPage') }}</UButton
						>
						<span class="text-xs text-slate-500">{{
							t('social.message.pageInfo', {
								page: pagination.page,
								total: pagination.totalPages,
							})
						}}</span>
						<UButton
							size="xs"
							color="neutral"
							variant="ghost"
							:disabled="loading || !pagination.hasNext"
							@click="changePage(1)"
							>{{ t('social.actions.nextPage') }}</UButton
						>
					</div>
				</div>
			</AnimatedModalBody>
		</template>
	</UModal>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import LinuxDoIcon from '~/assets/icons/linux-do.svg'
import type {
	LoginUserListItem,
	LoginUserListResponse,
	OAuthProviderName,
} from '~/shared/types/social'

const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ 'refresh-summary': [] }>()
const { t } = useI18n({ useScope: 'global' })
const { showError } = useSocialFeedback()
const items = ref<LoginUserListItem[]>([])
const loading = ref(false)
const currentPage = ref(1)
const pagination = ref<LoginUserListResponse['pagination']>({
	page: 1,
	pageSize: 10,
	totalPages: 1,
	totalCount: 0,
	hasPrev: false,
	hasNext: false,
})
const formatTime = (value: string) => dayjs(value).format('YYYY-MM-DD HH:mm')
const getIdentityProfileUrl = (
	item: LoginUserListItem,
	provider: OAuthProviderName,
): string | undefined =>
	item.identities.find((identity) => identity.provider === provider)?.profileUrl

const loadItems = async () => {
	loading.value = true
	try {
		const response = await $fetch<LoginUserListResponse>(
			'/api/site-like/users',
			{ query: { page: currentPage.value, pageSize: 10 } },
		)
		items.value = response.items
		pagination.value = response.pagination
		currentPage.value = response.pagination.page
	} catch (error) {
		showError(error)
	} finally {
		loading.value = false
	}
}
const changePage = (delta: number) => {
	currentPage.value += delta
	void loadItems()
}
watch(open, (value) => {
	if (!value) return
	currentPage.value = 1
	void loadItems()
	emit('refresh-summary')
})
</script>
