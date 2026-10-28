<script setup lang="ts">
import LinuxDoIcon from '~/assets/icons/linux-do.svg'
import type { FriendLinkApplicant } from '~/shared/types/social'
interface Props {
	applicant: FriendLinkApplicant
}
defineProps<Props>()
</script>

<template>
	<span
		class="inline-flex min-w-0 items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300"
	>
		<UIcon
			v-if="applicant.providers.includes('GITHUB')"
			name="i-lucide-github"
			class="size-3.5 shrink-0"
			aria-label="GitHub"
		/>
		<LinuxDoIcon
			v-if="applicant.providers.includes('LINUX_DO')"
			class="size-3.5 shrink-0"
			aria-label="Linux DO"
		/>
		<span class="min-w-0 [overflow-wrap:anywhere]"
			>@{{ applicant.username }}</span
		>
	</span>
</template>
