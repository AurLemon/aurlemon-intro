<template>
	<h2
		class="w-full min-w-0 text-xl leading-7 font-medium text-slate-900 dark:text-slate-100"
	>
		<span class="relative block w-fit min-w-0 max-w-[calc(100%_-_0.875rem)]">
			<FriendLinkMarquee :text="text" :end-padding="false" />
			<UIcon
				name="i-lucide-arrow-up-right"
				class="absolute top-1/2 left-[calc(100%_+_0.375rem)] m-0 size-4 -translate-y-1/2 p-0 text-slate-700 dark:text-slate-300"
				aria-hidden="true"
			/>
		</span>
	</h2>
</template>

<script setup lang="ts">
import FriendLinkMarquee from './FriendLinkMarquee.vue'
interface Props {
	text: string
}
defineProps<Props>()
</script>
