<template>
	<UModal
		v-model:open="open"
		:title="t('social.account.title')"
		class="max-w-lg"
		:ui="{
			overlay: 'z-[44000]',
			content: 'z-[44010] !w-[calc(100vw-2rem)] sm:!w-full',
			wrapper: 'sr-only',
			body: 'max-h-[75vh] overflow-y-auto',
		}"
	>
		<template #actions>
			<div role="tablist" class="flex min-w-0 flex-1 gap-1 pe-8">
				<UButton
					v-for="tab in tabs"
					:key="tab.value"
					type="button"
					role="tab"
					size="xs"
					color="neutral"
					:variant="activeTab === tab.value ? 'soft' : 'ghost'"
					:aria-selected="activeTab === tab.value"
					class="min-w-0 flex-1 justify-center sm:flex-none"
					@click="activeTab = tab.value"
				>
					{{ tab.label }}
				</UButton>
			</div>
		</template>

		<template #body>
			<AnimatedModalBody>
				<div v-if="loading" class="space-y-3">
					<USkeleton class="h-10 w-full" />
					<USkeleton class="h-32 w-full" />
				</div>

				<div v-else-if="account" class="space-y-5">
					<UAlert
						v-if="mergeToken"
						color="warning"
						variant="soft"
						:title="t('social.account.mergeTitle')"
						:description="t('social.account.mergeDescription')"
					>
						<template #actions>
							<UButton
								size="xs"
								color="warning"
								:loading="saving"
								@click="confirmMerge"
							>
								{{ t('social.actions.confirmMerge') }}
							</UButton>
						</template>
					</UAlert>

					<form
						v-if="activeTab === 'profile'"
						class="space-y-5"
						@submit.prevent="saveProfile"
					>
						<section class="space-y-3">
							<p class="text-sm font-medium text-slate-700 dark:text-slate-200">
								{{ t('social.account.loginMethods') }}
							</p>
							<div
								v-for="provider in providerRows"
								:key="provider.value"
								class="flex items-center gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700"
							>
								<UIcon
									v-if="provider.value === 'GITHUB'"
									name="i-lucide-github"
									class="h-5 w-5"
								/>
								<LinuxDoIcon v-else class="h-5 w-5" />
								<div class="min-w-0 flex-1">
									<p class="text-sm font-medium">{{ provider.label }}</p>
									<p class="truncate text-xs text-slate-500">
										{{
											provider.identity
												? `@${provider.identity.providerUsername}`
												: t('social.account.notConnected')
										}}
									</p>
								</div>
								<UButton
									v-if="!provider.identity"
									size="xs"
									@click="auth.login(provider.value, 'connect')"
								>
									{{ t('social.actions.connect') }}
								</UButton>
								<UButton
									v-else
									size="xs"
									color="error"
									variant="ghost"
									:disabled="account.user.identities.length <= 1"
									@click="disconnect(provider.value)"
								>
									{{ t('social.actions.disconnect') }}
								</UButton>
							</div>
						</section>
						<UFormField :label="t('social.account.avatarSource')">
							<div class="flex flex-wrap gap-3">
								<div
									v-for="identity in account.user.identities"
									:key="identity.id"
									class="flex w-12 flex-col items-center gap-1.5"
								>
									<button
										type="button"
										class="inline-flex size-12 shrink-0 items-center justify-center rounded-full border-2 p-0.5 leading-none transition-colors"
										:class="
											profile.preferredAvatarIdentityId === identity.id
												? 'border-primary-500'
												: 'border-transparent'
										"
										:title="identity.providerUsername"
										@click="profile.preferredAvatarIdentityId = identity.id"
									>
										<SkeletonImage
											:src="identity.avatarUrl"
											:alt="identity.providerUsername"
											class="block size-10"
											image-class="block size-10 rounded-full object-cover"
											skeleton-class="size-10 rounded-full"
										/>
									</button>
									<div
										class="w-full text-center text-slate-600 dark:text-slate-300"
									>
										<span
											class="block w-full truncate text-[11px] leading-tight"
										>
											{{
												identity.provider === 'GITHUB' ? 'GitHub' : 'Linux DO'
											}}
										</span>
										<span
											class="block w-full truncate text-[10px] leading-tight opacity-70"
										>
											@{{ identity.providerUsername }}
										</span>
									</div>
								</div>
							</div>
						</UFormField>
						<UFormField :label="t('social.account.username')">
							<UInput
								v-model="profile.username"
								maxlength="39"
								class="w-full"
							/>
							<p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
								{{ t('social.account.usernameChangeHint') }}
							</p>
						</UFormField>
						<UFormField :label="t('social.account.displayName')">
							<UInput
								v-model="profile.displayName"
								maxlength="64"
								class="w-full"
							/>
						</UFormField>
						<UFormField :label="t('social.account.notificationLanguage')">
							<USelect
								v-model="profile.preferredLocale"
								:items="localeOptions"
								value-key="value"
								label-key="label"
								class="w-full"
								:ui="{ content: 'z-[44100]' }"
							/>
						</UFormField>
						<div class="flex justify-end">
							<UButton type="submit" :loading="saving">{{
								t('social.actions.save')
							}}</UButton>
						</div>
					</form>

					<div v-else class="space-y-5">
						<form class="flex gap-2" @submit.prevent="addEmail">
							<UInput
								v-model="emailDraft"
								type="email"
								:placeholder="t('social.account.emailPlaceholder')"
								class="flex-1"
							/>
							<UButton type="submit" :loading="saving">{{
								t('social.actions.verifyEmail')
							}}</UButton>
						</form>
						<TransitionGroup name="email-list" tag="div" class="space-y-2">
							<div
								v-for="email in account.emails"
								:key="email.id"
								class="flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-800/70"
							>
								<div class="min-w-0 flex-1">
									<p class="truncate">{{ email.email }}</p>
									<p class="text-xs text-slate-500">
										{{
											email.verified
												? t('social.account.verified')
												: t('social.account.unverified')
										}}<span v-if="email.isPrimary">
											/ {{ t('social.account.primary') }}</span
										>
									</p>
								</div>
								<UButton
									v-if="email.verified && !email.isPrimary"
									size="xs"
									color="neutral"
									variant="ghost"
									@click="makePrimary(email.id)"
									>{{ t('social.actions.setPrimary') }}</UButton
								>
								<UButton
									size="xs"
									color="error"
									variant="ghost"
									icon="i-lucide-trash-2"
									@click="removeEmail(email.id)"
								/>
							</div>
						</TransitionGroup>
						<div class="space-y-3 pt-3">
							<label class="flex items-center justify-between gap-4 text-sm">
								<span>{{ t('social.account.replyNotifications') }}</span>
								<USwitch
									v-model="account.notifications.replyEmailEnabled"
									@update:model-value="saveNotifications"
								/>
							</label>
							<label
								v-if="account.user.isAdmin"
								class="flex items-center justify-between gap-4 text-sm"
							>
								<span>{{ t('social.account.adminCommentNotifications') }}</span>
								<USwitch
									v-model="account.notifications.adminCommentEmailEnabled"
									@update:model-value="saveNotifications"
								/>
							</label>
							<label
								v-if="account.user.isAdmin"
								class="flex items-center justify-between gap-4 text-sm"
							>
								<span>{{
									t('social.account.adminFriendLinkNotifications')
								}}</span>
								<USwitch
									v-model="account.notifications.adminFriendLinkEmailEnabled"
									@update:model-value="saveNotifications"
								/>
							</label>
						</div>
					</div>
				</div>
			</AnimatedModalBody>
		</template>
	</UModal>
</template>

<script setup lang="ts">
import LinuxDoIcon from '~/assets/icons/linux-do.svg'
import type {
	AccountDetails,
	AuthIdentity,
	AuthUser,
	OAuthProviderName,
} from '~/shared/types/social'

type AccountTab = 'profile' | 'email'

const { t } = useI18n({ useScope: 'global' })
const route = useRoute()
const router = useRouter()
const auth = useAuth()
const modal = useAccountModal()
const { showError, showSessionExpired } = useSocialFeedback()
const toast = useToast()
const open = modal.open
const account = ref<AccountDetails | null>(null)
const loading = ref(false)
const saving = ref(false)
const activeTab = ref<AccountTab>('profile')
const emailDraft = ref('')
const mergeToken = ref<string | null>(null)
const profile = reactive({
	username: '',
	displayName: '',
	preferredAvatarIdentityId: '',
	preferredLocale: 'zh-CN',
})

const tabs = computed(() => [
	{ value: 'profile' as const, label: t('social.account.profileTab') },
	{ value: 'email' as const, label: t('social.account.emailTab') },
])
const localeOptions = [
	{ label: '简体中文', value: 'zh-CN' },
	{ label: 'English', value: 'en-US' },
	{ label: '日本語', value: 'ja-JP' },
]
const providerRows = computed(() =>
	(
		[
			{ value: 'GITHUB' as const, label: 'GitHub' },
			{ value: 'LINUX_DO' as const, label: 'Linux DO' },
		] satisfies Array<{ value: OAuthProviderName; label: string }>
	).map((item) => ({
		...item,
		identity: account.value?.user.identities.find(
			(identity) => identity.provider === item.value,
		) as AuthIdentity | undefined,
	})),
)

const syncProfile = () => {
	if (!account.value) return
	profile.username = account.value.user.username
	profile.displayName = account.value.user.displayName
	profile.preferredAvatarIdentityId =
		account.value.user.preferredAvatarIdentityId ??
		account.value.user.identities[0]?.id ??
		''
	profile.preferredLocale = account.value.user.preferredLocale
}

const syncEmailAvailability = (emails: AccountDetails['emails']): void => {
	const hasVerifiedPrimaryEmail = emails.some(
		(email) => email.isPrimary && email.verified,
	)
	if (auth.user.value) {
		auth.user.value = { ...auth.user.value, hasVerifiedPrimaryEmail }
	}
	if (account.value) {
		account.value.user = {
			...account.value.user,
			hasVerifiedPrimaryEmail,
		}
	}
}

const loadAccount = async () => {
	loading.value = true
	try {
		await auth.ensureReady()
		if (!auth.user.value) {
			account.value = null
			modal.hide()
			showSessionExpired()
			return
		}
		const response = await $fetch<{ account: AccountDetails }>('/api/account')
		account.value = response.account
		auth.user.value = response.account.user
		syncProfile()
	} catch (error) {
		showError(error)
	} finally {
		loading.value = false
	}
}

const runSaving = async (action: () => Promise<void>) => {
	saving.value = true
	try {
		await action()
	} catch (error) {
		showError(error)
	} finally {
		saving.value = false
	}
}

const saveProfile = () =>
	runSaving(async () => {
		const response = await $fetch<{ user: AuthUser }>('/api/account/profile', {
			method: 'PATCH',
			body: profile,
		})
		auth.user.value = response.user
		if (account.value) {
			account.value.user = response.user
			syncProfile()
		}
		toast.add({
			title: t('social.feedback.profileSaveSuccessTitle'),
			color: 'success',
			icon: 'i-lucide-circle-check',
		})
	})

const addEmail = () =>
	runSaving(async () => {
		const response = await $fetch<{ email: AccountDetails['emails'][number] }>(
			'/api/account/emails',
			{
				method: 'POST',
				body: { email: emailDraft.value },
			},
		)
		emailDraft.value = ''
		if (account.value) {
			account.value.emails = [
				...account.value.emails.filter(
					(email) => email.id !== response.email.id,
				),
				response.email,
			]
			syncEmailAvailability(account.value.emails)
		}
	})

const makePrimary = (id: string) =>
	runSaving(async () => {
		const response = await $fetch<{ emails: AccountDetails['emails'] }>(
			`/api/account/emails/${id}/primary`,
			{ method: 'PATCH' },
		)
		if (account.value) {
			account.value.emails = response.emails
			syncEmailAvailability(response.emails)
		}
	})

const removeEmail = (id: string) =>
	runSaving(async () => {
		const response = await $fetch<{ removed: { id: string } }>(
			`/api/account/emails/${id}`,
			{ method: 'DELETE' },
		)
		if (account.value) {
			account.value.emails = account.value.emails.filter(
				(email) => email.id !== response.removed.id,
			)
			syncEmailAvailability(account.value.emails)
		}
	})

const saveNotifications = () =>
	runSaving(async () => {
		if (!account.value) return
		const response = await $fetch<{
			notifications: AccountDetails['notifications']
		}>('/api/account/notifications', {
			method: 'PATCH',
			body: account.value.notifications,
		})
		if (account.value) {
			account.value.notifications = response.notifications
		}
	})

const disconnect = (provider: OAuthProviderName) =>
	runSaving(async () => {
		const response = await $fetch<{ user: AuthUser }>(
			`/api/account/identities/${provider}`,
			{ method: 'DELETE' },
		)
		auth.user.value = response.user
		if (account.value) {
			account.value.user = response.user
			syncProfile()
		}
	})

const confirmMerge = () =>
	runSaving(async () => {
		const response = await $fetch<{ user: AuthUser }>('/api/account/merge', {
			method: 'POST',
			body: { token: mergeToken.value },
		})
		mergeToken.value = null
		auth.user.value = response.user
		await loadAccount()
		toast.add({
			title: t('social.feedback.mergeSuccessTitle'),
			description: t('social.feedback.mergeSuccessDescription'),
			color: 'success',
			icon: 'i-lucide-circle-check',
		})
	})

const consumeRouteSignals = async () => {
	const token =
		typeof route.query.accountMerge === 'string'
			? route.query.accountMerge
			: null
	const emailVerified = route.query.emailVerified === '1'
	if (!token && !emailVerified) return
	mergeToken.value = token
	activeTab.value = token ? 'profile' : 'email'
	open.value = true
	const query = { ...route.query }
	delete query.accountMerge
	delete query.emailVerified
	await router.replace({ path: route.path, query, hash: route.hash })
}

watch(open, (value) => {
	if (value) void loadAccount()
})

onMounted(async () => {
	await consumeRouteSignals()
})
</script>

<style scoped>
.email-list-enter-active,
.email-list-leave-active,
.email-list-move {
	transition:
		opacity 180ms ease,
		transform 180ms ease;
}

.email-list-enter-from,
.email-list-leave-to {
	opacity: 0;
	transform: translateY(-0.5rem);
}
</style>
