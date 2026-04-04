<template>
	<div class="space-y-6">
		<ContentHeader :bg-src="linksCover" :title="$t('menu.friends')"
			>👂👃👂</ContentHeader
		>

		<div class="grid gap-5 md:grid-cols-2 px-6">
			<NuxtLink
				v-for="friend in friends"
				:key="friend.name"
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
	</div>
</template>

<script setup lang="ts">
import ContentHeader from '~/components/ContentHeader.vue'
import linksCover from '~/assets/resources/pages/links_cover.webp'
import friendData from '~/assets/utils/config.json'

type FriendLink = (typeof friendData.friend_link)[number]

const friends = friendData.friend_link as FriendLink[]
</script>
