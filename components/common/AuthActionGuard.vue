<template>
	<UAlert
		color="primary"
		variant="soft"
		:title="title"
		:description="description"
	>
		<template v-if="showLoginButton" #actions>
			<UPopover :ui="{ content: 'z-[44020]' }">
				<UButton size="sm" color="primary">
					{{ t('social.actions.loginOrRegister') }}
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
		</template>
	</UAlert>
</template>

<script setup lang="ts">
import LinuxDoIcon from '~/assets/icons/linux-do.svg'
import type { OAuthProviderName } from '~/shared/types/social'

const props = defineProps<{
	title: string
	description: string
	showLoginButton?: boolean
}>()

const { t } = useI18n({ useScope: 'global' })
const auth = useAuth()
const { showError } = useSocialFeedback()
const loginProvider = ref<OAuthProviderName | null>(null)

const title = computed(() => props.title)
const description = computed(() => props.description)
const showLoginButton = computed(() => props.showLoginButton !== false)

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
</script>
