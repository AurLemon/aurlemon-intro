<template>
	<div class="space-y-6 flex flex-col flex-1">
		<ContentHeader :bg-src="linksCover" :title="$t('menu.friends')"
			>👂👃👂</ContentHeader
		>

		<div v-if="!friends.length" class="px-6">
			<div class="text-center text-slate-600 dark:text-slate-300 text-sm">
				{{ $t('social.friendLinks.emptyLinks') }}
			</div>
		</div>

		<div v-else class="grid gap-5 md:grid-cols-2 px-6">
			<NuxtLink
				v-for="friend in friends"
				:key="friend.id"
				:to="friend.url"
				target="_blank"
				rel="noopener noreferrer"
				class="group border-6 border-slate-200 hover:border-slate-400/60 dark:border-slate-800 rounded-xl relative transition p-3"
			>
				<div class="flex items-start gap-4">
					<img
						:src="friend.icon"
						:alt="friend.name"
						class="h-14 w-14 rounded object-cover"
					/>
					<div class="min-w-0 flex-1">
						<h2
							class="truncate text-lg font-medium text-slate-900 dark:text-slate-100"
						>
							{{ friend.name }}
						</h2>
						<div class="text-sm text-slate-600 dark:text-slate-300">
							{{ friend.desc }}
						</div>
					</div>
				</div>
			</NuxtLink>
		</div>

		<div class="flex flex-wrap items-center justify-center gap-1 px-6 mt-auto">
			<SocialAuthStatusBar compact />
			<UButton
				color="primary"
				size="xs"
				variant="link"
				@click="applyOpen = true"
			>
				<span class="leading-[normal]">
					{{ $t('social.actions.applyFriendLink') }}
				</span>
			</UButton>
		</div>

		<FriendLinkApplyModal
			v-model:open="applyOpen"
			@open-admin="openAdminFromApply"
			@submitted="refresh()"
		/>
		<FriendLinkAdminModal v-model:open="adminOpen" @updated="refresh()" />
	</div>
</template>

<script setup lang="ts">
import ContentHeader from '~/components/content/ContentHeader.vue'
import SocialAuthStatusBar from '~/components/common/SocialAuthStatusBar.vue'
import FriendLinkAdminModal from '~/components/friends/FriendLinkAdminModal.vue'
import FriendLinkApplyModal from '~/components/friends/FriendLinkApplyModal.vue'
import linksCover from '~/assets/resources/pages/links_cover.webp'
import type { FriendLinksResponse } from '~/shared/types/social'

const applyOpen = ref(false)
const adminOpen = ref(false)

const openAdminFromApply = async () => {
	applyOpen.value = false
	await nextTick()
	adminOpen.value = true
}

const { data, refresh } =
	await useFetch<FriendLinksResponse>('/api/friend-links')

const friends = computed(() => data.value?.items ?? [])
</script>
