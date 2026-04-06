<template>
	<UModal
		v-model:open="open"
		:title="t('social.friendLinks.applyTitle')"
		class="max-w-md"
		:ui="{
			overlay: 'z-[41000]',
			content: 'z-[41010]',
		}"
	>
		<template #actions>
			<UButton
				v-if="currentUser?.isAdmin"
				size="xs"
				color="neutral"
				variant="link"
				@click="emit('open-admin')"
			>
				<span class="leading-[normal]">
					{{ t('social.friendLinks.adminEntry') }}
				</span>
			</UButton>
		</template>

		<template #body>
			<div class="space-y-4">
				<AuthActionGuard
					v-if="!currentUser"
					:title="t('social.friendLinks.loginRequiredTitle')"
					:description="t('social.friendLinks.loginRequiredDesc')"
					:show-login-button="false"
				/>
				<div v-else class="space-y-4">
					<p
						class="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100"
					>
						{{
							t('social.friendLinks.applyReminder', {
								mail: reminderMail,
							})
						}}
					</p>
					<div class="space-y-2">
						<label class="text-sm text-slate-700 dark:text-slate-300">
							{{ t('social.friendLinks.fields.name') }}
						</label>
						<UInput
							v-model="form.name"
							class="w-full"
							:placeholder="t('social.friendLinks.fields.name')"
						/>
					</div>
					<div class="space-y-2">
						<label class="text-sm text-slate-700 dark:text-slate-300">
							{{ t('social.friendLinks.fields.url') }}
						</label>
						<UInput
							v-model="form.url"
							class="w-full"
							:placeholder="t('social.friendLinks.fields.url')"
						/>
					</div>
					<div class="space-y-2">
						<label class="text-sm text-slate-700 dark:text-slate-300">
							{{ t('social.friendLinks.fields.desc') }}
						</label>
						<UTextarea
							v-model="form.desc"
							class="w-full"
							:rows="4"
							:placeholder="t('social.friendLinks.fields.desc')"
						/>
					</div>
					<div class="space-y-2">
						<label class="text-sm text-slate-700 dark:text-slate-300">
							{{ t('social.friendLinks.fields.image') }}
						</label>
						<input
							ref="fileInputRef"
							type="file"
							accept="image/*"
							class="hidden"
							@change="handleFileChange"
						/>
						<UButton
							size="xs"
							color="neutral"
							class="m-0"
							variant="link"
							@click="openFilePicker"
						>
							{{ t('social.friendLinks.fields.chooseImage') }}
						</UButton>
						<p class="text-sm text-slate-500 dark:text-slate-400">
							{{
								selectedImageName ||
								t('social.friendLinks.fields.noFileSelected')
							}}
						</p>
						<img
							v-if="form.imageBase64"
							:src="form.imageBase64"
							alt="preview"
							class="h-20 w-20 rounded-xl object-cover"
						/>
					</div>
				</div>
			</div>
		</template>

		<template #footer>
			<SocialAuthStatusBar class="shrink-0" compact />
			<div class="flex w-full justify-end gap-3">
				<UButton color="neutral" variant="ghost" @click="open = false">
					{{ t('social.actions.close') }}
				</UButton>
				<UButton
					:loading="submitting"
					:disabled="!currentUser"
					color="primary"
					@click="submit"
				>
					{{ t('social.actions.submitApplication') }}
				</UButton>
			</div>
		</template>
	</UModal>
</template>

<script setup lang="ts">
import AuthActionGuard from '~/components/common/AuthActionGuard.vue'
import SocialAuthStatusBar from '~/components/common/SocialAuthStatusBar.vue'

const open = defineModel<boolean>('open', { default: false })

const emit = defineEmits<{
	'open-admin': []
	submitted: []
}>()
const { t, locale } = useI18n()
const auth = useGithubAuth()
const { showAuthRequired, showError } = useSocialFeedback()
const { normalizeImage } = useFriendLinkImage()

const submitting = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)
const selectedImageName = ref('')
const currentUser = computed(() => auth.user.value)
const reminderMail = computed(() =>
	locale.value.toLowerCase().startsWith('zh')
		? '2115386831@qq.com'
		: 'aurlemoncn@gmail.com',
)
const form = reactive({
	name: '',
	url: '',
	desc: '',
	imageBase64: '',
})

const resetForm = () => {
	form.name = ''
	form.url = ''
	form.desc = ''
	form.imageBase64 = ''
	selectedImageName.value = ''
}

const handleFileChange = async (event: Event) => {
	const input = event.target as HTMLInputElement
	const file = input.files?.[0]

	if (!file) {
		return
	}

	try {
		selectedImageName.value = file.name
		form.imageBase64 = await normalizeImage(file)
	} catch (error) {
		showError(error)
	}
}

const openFilePicker = () => {
	fileInputRef.value?.click()
}

const submit = async () => {
	if (!auth.isLoggedIn.value) {
		showAuthRequired()
		return
	}

	submitting.value = true

	try {
		await $fetch('/api/friend-links/applications', {
			method: 'POST',
			body: {
				name: form.name,
				url: form.url,
				desc: form.desc,
				imageBase64:
					typeof form.imageBase64 === 'string' &&
					form.imageBase64.startsWith('data:image/')
						? form.imageBase64
						: null,
			},
		})
		resetForm()
		emit('submitted')
		open.value = false
	} catch (error) {
		showError(error)
	} finally {
		submitting.value = false
	}
}

watch(open, (value) => {
	if (value) {
		void auth.ensureReady()
	}
})
</script>
