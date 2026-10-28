<template>
	<div class="flex min-w-0 flex-col flex-1">
		<ContentHeader
			page="friends"
			:title="$t('main.contentPages.friends.title')"
		/>

		<div v-if="!friends.length" class="py-6">
			<div class="text-center text-slate-600 dark:text-slate-300 text-sm">
				{{ $t('social.friendLinks.emptyLinks') }}
			</div>
		</div>

		<div v-else class="grid gap-5 grid-cols-1 lg:grid-cols-3 mt-6">
			<FriendLinkCard
				v-for="friend in friends"
				:key="friend.id"
				:friend="friend"
			/>
		</div>

		<div class="flex flex-wrap items-center justify-center gap-3 pt-6 mt-auto">
			<AccountStatusBar compact />
			<UButton color="primary" size="xs" @click="applyOpen = true">
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
import FriendLinkCard from '~/components/friends/FriendLinkCard.vue'
import ContentHeader from '~/components/content/ContentHeader.vue'
import AccountStatusBar from '~/components/common/AccountStatusBar.vue'
import FriendLinkAdminModal from '~/components/friends/FriendLinkAdminModal.vue'
import FriendLinkApplyModal from '~/components/friends/FriendLinkApplyModal.vue'
import type { FriendLinksResponse } from '~/shared/types/social'

const applyOpen = ref(false)
const adminOpen = ref(false)
const route = useRoute()

onMounted(() => {
	if (route.query.social === 'friend-links') {
		adminOpen.value = true
	}
})

const openAdminFromApply = async () => {
	applyOpen.value = false
	await nextTick()
	adminOpen.value = true
}

const { data, refresh } =
	await useFetch<FriendLinksResponse>('/api/friend-links')

const friends = computed(() => data.value?.items ?? [])
</script>
