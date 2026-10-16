<template>
	<UPopover
		v-model:open="open"
		mode="hover"
		:open-delay="100"
		:close-delay="0"
		:content="{ side: 'bottom', align: 'start' }"
		:ui="{ content: 'z-[43120]' }"
	>
		<slot />

		<template #content>
			<div @pointerleave="close">
				<ul
					:aria-label="$t('social.message.likedByUsers')"
					class="max-h-52 w-56 max-w-[calc(100vw-2rem)] space-y-0.5 overflow-y-auto overscroll-contain p-1.5 focus-visible:outline-2 focus-visible:outline-primary"
				>
					<li
						v-for="user in users"
						:key="user.id"
						class="flex min-w-0 items-center gap-2 rounded-md px-1.5 py-1.5"
					>
						<UAvatar
							:src="user.avatarUrl || undefined"
							:alt="user.displayName"
							size="xs"
							class="shrink-0"
						/>
						<div class="min-w-0 flex-1">
							<p
								class="truncate text-xs font-medium text-slate-800 dark:text-slate-200"
							>
								{{ user.displayName }}
							</p>
							<p
								class="truncate text-[11px] text-slate-500 dark:text-slate-400"
							>
								@{{ user.username }}
							</p>
						</div>
					</li>
				</ul>
			</div>
		</template>
	</UPopover>
</template>

<script setup lang="ts">
import type { MessageCommentLikeUser } from '~/shared/types/social'
interface Props {
	users: MessageCommentLikeUser[]
}
defineProps<Props>()
const open = ref(false)
const close = () => {
	open.value = false
}
</script>
