<template>
	<UModal
		v-model:open="open"
		:title="t('social.githubLogin.listTitle')"
		class="max-w-md"
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
					:title="t('social.githubLogin.emptyTitle')"
					:description="t('social.githubLogin.emptyDesc')"
				/>
				<div
					v-else
					ref="listRef"
					class="space-y-2 max-h-[60vh] overflow-y-auto pr-1"
				>
					<div v-for="item in items" :key="item.id">
						<div class="flex items-center gap-3">
							<div
								class="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800"
							>
								<USkeleton
									v-if="item.avatarUrl && !isAvatarLoaded(item.id)"
									class="absolute inset-0 rounded-full"
								/>
								<img
									v-if="item.avatarUrl"
									:src="item.avatarUrl"
									:alt="item.displayLogin"
									class="h-full w-full object-cover transition-opacity duration-200"
									:class="[
										item.canViewProfile ? '' : 'blur-[2px]',
										isAvatarLoaded(item.id) ? 'opacity-100' : 'opacity-0',
									]"
									@load="markAvatarLoaded(item.id)"
									@error="markAvatarLoaded(item.id)"
								/>
								<UIcon
									v-else
									name="i-lucide-user-round"
									class="h-3.5 w-3.5 text-slate-500 dark:text-slate-400"
								/>
							</div>
							<div
								class="min-w-0 flex-1 flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
							>
								<div class="min-w-0 leading-none">
									<NuxtLink
										v-if="item.canViewProfile && item.profileUrl"
										:to="item.profileUrl"
										target="_blank"
										rel="noopener noreferrer"
										class="inline-flex max-w-full items-center gap-1 text-sm font-semibold text-slate-900 hover:underline dark:text-slate-100"
									>
										<UIcon
											name="i-lucide-github"
											class="h-3.5 w-3.5 shrink-0 p-0"
										/>
										<span class="truncate">{{ item.displayLogin }}</span>
									</NuxtLink>
									<p
										v-else
										class="truncate text-sm font-mono text-slate-900 dark:text-slate-100"
									>
										{{ item.displayLogin }}
									</p>
								</div>
								<p
									class="text-xs text-slate-500 dark:text-slate-400 sm:shrink-0"
								>
									{{ formatTime(item.createdAt) }}
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
	GithubLoginUserListItem,
	GithubLoginUserListResponse,
} from '~/shared/types/social'

const open = defineModel<boolean>('open', { default: false })

const { t } = useI18n()
const { showError } = useSocialFeedback()

const items = ref<GithubLoginUserListItem[]>([])
const loading = ref(false)
const listRef = ref<HTMLElement | null>(null)
const avatarLoadedIds = ref<Record<string, boolean>>({})

const formatTime = (value: string) => dayjs(value).format('YYYY-MM-DD HH:mm')

const isAvatarLoaded = (id: string) => avatarLoadedIds.value[id] === true

const markAvatarLoaded = (id: string) => {
	avatarLoadedIds.value[id] = true
}

const loadItems = async () => {
	loading.value = true

	try {
		const response = await $fetch<GithubLoginUserListResponse>(
			'/api/site-like/github-logins',
		)
		items.value = response.items
		avatarLoadedIds.value = {}
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
