<template>
	<UFormField
		:label="provider === 'GITHUB' ? 'GitHub' : 'Linux DO'"
		:help="
			account?.profileResolved === false
				? t('social.friendLinks.ownerProfileUnavailable', {
						username: account.username,
					})
				: account
					? `${account.displayName} (@${account.username})`
					: undefined
		"
		:error="errorKey ? t(errorKey) : undefined"
	>
		<UInput
			v-model="username"
			class="w-full"
			:placeholder="t('social.friendLinks.ownerPlaceholder')"
			:loading="loading"
			:aria-label="provider === 'GITHUB' ? 'GitHub' : 'Linux DO'"
			autocomplete="off"
			:ui="{ leading: 'pointer-events-none' }"
		>
			<template #leading>
				<UAvatar
					v-if="account?.avatarUrl"
					:as="{ img: SkeletonImage }"
					image-class="size-full object-cover"
					:ui="{ root: 'overflow-hidden', image: 'size-full' }"
					:src="socialAvatar(account.avatarUrl)"
					:alt="account.username"
					class="size-5"
				/>
				<UIcon
					v-else-if="provider === 'GITHUB'"
					name="i-lucide-github"
					class="size-5 text-slate-600 dark:text-slate-300"
					aria-label="GitHub"
				/>
				<LinuxDoIcon v-else class="size-5" aria-label="Linux DO" />
			</template>
		</UInput>
	</UFormField>
</template>

<script setup lang="ts">
import SkeletonImage from '~/components/common/SkeletonImage.vue'
import LinuxDoIcon from '~/assets/icons/linux-do.svg'
import type {
	FriendLinkOwnerAccount,
	OAuthProviderName,
} from '~/shared/types/social'
const socialAvatar = useSocialAvatar()
interface Props {
	provider: OAuthProviderName
}
const props = defineProps<Props>()
const username = defineModel<string>({ required: true })
const emit = defineEmits<{ pending: [value: boolean] }>()
const { t } = useI18n()
const account = ref<FriendLinkOwnerAccount | null>(null)
const errorKey = ref('')
const loading = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined
let controller: AbortController | undefined
let generation = 0
watch(
	username,
	(value) => {
		clearTimeout(timer)
		controller?.abort()
		const request = ++generation
		account.value = null
		errorKey.value = ''
		loading.value = Boolean(value.trim())
		emit('pending', loading.value)
		if (!value.trim()) return
		timer = setTimeout(async () => {
			controller = new AbortController()
			try {
				const result = await $fetch<FriendLinkOwnerAccount>(
					'/api/friend-links/admin/owner',
					{
						query: { provider: props.provider, username: value },
						signal: controller.signal,
					},
				)
				if (request !== generation) return
				account.value = result
			} catch (error) {
				if (request === generation)
					errorKey.value = resolveSocialErrorKey(error)
			} finally {
				if (request === generation) {
					loading.value = false
					emit('pending', false)
				}
			}
		}, 450)
	},
	{ immediate: true },
)
onBeforeUnmount(() => {
	++generation
	clearTimeout(timer)
	controller?.abort()
	emit('pending', false)
})
</script>
