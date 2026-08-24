<template>
	<UPopover v-if="!currentUser" :ui="{ content: 'z-[44020]' }">
		<UButton
			type="button"
			size="xs"
			color="neutral"
			variant="link"
			class="gap-2 px-0 text-primary-600 hover:text-primary-700 dark:text-primary-300 dark:hover:text-primary-200"
		>
			<UIcon name="i-lucide-log-in" class="h-4 w-4" />
			<span class="leading-[normal]">
				{{ t('social.actions.loginWithProvider') }}
			</span>
		</UButton>

		<template #content>
			<div class="w-52 space-y-1 p-2">
				<p class="px-3 py-2 text-xs text-slate-500 dark:text-slate-400">
					{{ t('social.account.chooseLoginProvider') }}
				</p>
				<UButton
					type="button"
					color="neutral"
					variant="ghost"
					class="w-full justify-start gap-2 rounded-lg px-3 py-2 text-sm"
					:loading="loginProvider === 'GITHUB'"
					:disabled="Boolean(loginProvider)"
					@click="startLogin('GITHUB')"
				>
					<UIcon name="i-lucide-github" class="h-4 w-4" />
					{{ t('social.actions.loginWithGithub') }}
				</UButton>
				<UButton
					type="button"
					color="neutral"
					variant="ghost"
					class="w-full justify-start gap-2 rounded-lg px-3 py-2 text-sm"
					:loading="loginProvider === 'LINUX_DO'"
					:disabled="Boolean(loginProvider)"
					@click="startLogin('LINUX_DO')"
				>
					<LinuxDoIcon class="h-4 w-4" />
					{{ t('social.actions.loginWithLinuxDo') }}
				</UButton>
			</div>
		</template>
	</UPopover>
	<UPopover
		v-else
		v-model:open="accountPopoverOpen"
		:ui="{ content: 'z-[44020]' }"
	>
		<button
			type="button"
			:class="
				compact
					? 'flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200'
					: 'flex w-full flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-2 text-left dark:border-slate-700 dark:bg-slate-800/70'
			"
			:aria-label="t('social.account.openUserMenu')"
		>
			<span class="flex min-w-0 items-center gap-1.5">
				<img
					:src="currentUser.avatarUrl"
					:alt="currentUser.displayName"
					class="h-5.5 w-5.5 rounded-full object-cover"
				/>
				<span class="truncate leading-[normal]">{{
					compact
						? `@${currentUser.username}`
						: t('social.auth.loggedInAs', { login: currentUser.username })
				}}</span>
				<UTooltip
					v-if="currentUser.hasVerifiedPrimaryEmail === false"
					:text="t('social.account.emailNotificationUnavailable')"
				>
					<UIcon
						name="i-lucide-mail-warning"
						class="h-3.5 w-3.5 shrink-0 text-amber-500 dark:text-amber-300"
						aria-hidden="true"
					/>
				</UTooltip>
			</span>
			<span v-if="!compact" class="text-xs text-slate-500">{{
				t('social.account.manage')
			}}</span>
		</button>

		<template #content>
			<div class="flex min-w-40 flex-col gap-1 p-2">
				<UButton
					type="button"
					color="neutral"
					variant="ghost"
					class="w-full justify-start gap-2 rounded-lg px-3 py-2 text-sm"
					@click="openSettings"
				>
					<UIcon name="i-lucide-settings" class="h-4 w-4" />
					{{ t('social.account.settings') }}
				</UButton>
				<UButton
					type="button"
					color="error"
					variant="ghost"
					class="w-full justify-start gap-2 rounded-lg px-3 py-2 text-sm"
					:loading="logoutBusy"
					:disabled="logoutBusy"
					@click="handleLogout"
				>
					<UIcon name="i-lucide-log-out" class="h-4 w-4" />
					{{ t('social.actions.logout') }}
				</UButton>
			</div>
		</template>
	</UPopover>
</template>

<script setup lang="ts">
import LinuxDoIcon from '~/assets/icons/linux-do.svg'
import type { OAuthProviderName } from '~/shared/types/social'

withDefaults(defineProps<{ compact?: boolean }>(), { compact: false })

const { t } = useI18n({ useScope: 'global' })
const auth = useAuth()
const modal = useAccountModal()
const { showError } = useSocialFeedback()
const toast = useToast()
const currentUser = computed(() => auth.user.value)
const loginProvider = ref<OAuthProviderName | null>(null)
const accountPopoverOpen = ref(false)
const logoutBusy = ref(false)

const openSettings = (): void => {
	accountPopoverOpen.value = false
	modal.show()
}

const handleLogout = async (): Promise<void> => {
	if (logoutBusy.value) return

	logoutBusy.value = true
	try {
		await auth.logout()
		accountPopoverOpen.value = false
		toast.add({
			title: t('social.feedback.logoutSuccessTitle'),
			color: 'success',
			icon: 'i-lucide-circle-check',
		})
	} catch (error) {
		showError(error)
	} finally {
		logoutBusy.value = false
	}
}

const startLogin = async (provider: OAuthProviderName): Promise<void> => {
	if (loginProvider.value) return
	loginProvider.value = provider
	try {
		await auth.login(provider)
	} catch (error) {
		loginProvider.value = null
		showError(error)
	}
}

onMounted(() => void auth.ensureReady())
</script>
