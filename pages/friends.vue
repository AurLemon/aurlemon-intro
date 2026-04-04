<template>
	<div class="space-y-6">
		<ContentHeader :bg-src="linksCover" :title="$t('menu.friends')"
			>👂👃👂</ContentHeader
		>

		<div class="grid gap-4 md:grid-cols-2">
			<NuxtLink
				v-for="friend in friends"
				:key="friend.name"
				:to="friend.url"
				target="_blank"
				rel="noopener noreferrer"
				class="group rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/70"
			>
				<div class="flex items-start gap-4">
					<img
						:src="friend.icon"
						:alt="friend.name"
						class="h-14 w-14 rounded-xl border border-slate-200 object-cover dark:border-slate-700"
					/>
					<div class="min-w-0 flex-1 space-y-1">
						<div class="flex items-center justify-between gap-3">
							<h2
								class="truncate text-lg font-medium text-slate-900 dark:text-slate-100"
							>
								{{ friend.name }}
							</h2>
							<UIcon
								name="i-lucide-arrow-up-right"
								class="shrink-0 text-slate-400 transition group-hover:text-sky-500"
							/>
						</div>
						<p class="text-sm text-slate-600 dark:text-slate-300">
							{{ friend.desc }}
						</p>
						<p class="text-xs text-slate-400 dark:text-slate-500">
							站长：{{ friend.stationmaster.name }} ·
							{{ friend.stationmaster.contact }}
						</p>
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
