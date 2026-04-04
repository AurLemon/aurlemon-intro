<template>
	<div
		:class="
			compact
				? 'flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200'
				: 'flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/70'
		"
	>
		<div
			v-if="currentUser"
			:class="compact ? '' : 'text-sm text-slate-700 dark:text-slate-200'"
		>
			{{
				compact
					? currentUser.githubLogin
					: t('social.auth.loggedInAs', { login: currentUser.githubLogin })
			}}
		</div>
		<div class="flex items-center gap-2">
			<UButton
				v-if="currentUser && !compact"
				size="xs"
				color="success"
				variant="link"
				disabled
			>
				<UIcon name="i-lucide-check-circle-2" class="h-4 w-4" />
				<span class="leading-[normal]">{{ t('social.auth.loggedIn') }}</span>
			</UButton>
			<UButton
				v-if="!currentUser"
				size="xs"
				color="primary"
				@click="auth.login()"
			>
				<span class="leading-[normal]">
					{{ t('social.actions.loginWithGithub') }}
				</span>
			</UButton>
			<UButton
				v-if="currentUser"
				size="xs"
				color="neutral"
				variant="link"
				@click="handleLogout"
			>
				<span class="leading-[normal]">
					{{ t('social.actions.logout') }}
				</span>
			</UButton>
		</div>
	</div>
</template>

<script setup lang="ts">
withDefaults(
	defineProps<{
		compact?: boolean
	}>(),
	{
		compact: false,
	},
)

const { t } = useI18n()
const auth = useGithubAuth()
const { showError } = useSocialFeedback()

const currentUser = computed(() => auth.user.value)

const handleLogout = async () => {
	try {
		await auth.logout()
	} catch (error) {
		showError(error)
	}
}

onMounted(() => {
	void auth.ensureReady()
})
</script>
