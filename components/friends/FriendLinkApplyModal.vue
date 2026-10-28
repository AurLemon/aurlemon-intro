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
			<AnimatedModalBody>
				<div class="space-y-4">
					<AuthActionGuard
						v-if="!currentUser"
						:title="t('social.friendLinks.loginRequiredTitle')"
						:description="t('social.friendLinks.loginRequiredDesc')"
						:show-login-button="false"
					/>
					<p
						v-if="currentUser"
						class="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100"
					>
						{{ t('social.friendLinks.applyReminder') }}
					</p>
					<UAlert
						:title="t('social.friendLinks.siteInfo.title')"
						color="warning"
						variant="soft"
						class="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100"
						:ui="{
							title: 'text-xs leading-5 font-medium',
							description: 'mt-1 text-xs leading-5 text-inherit',
						}"
					>
						<template #description>
							<dl
								class="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 select-text"
							>
								<dt>{{ t('social.friendLinks.fields.name') }}</dt>
								<dd class="[overflow-wrap:anywhere]">AurLemon Intro</dd>
								<dt>{{ t('social.friendLinks.fields.desc') }}</dt>
								<dd class="[overflow-wrap:anywhere]">
									{{ t('social.friendLinks.siteInfo.description') }}
								</dd>
								<dt>ICON</dt>
								<dd class="[overflow-wrap:anywhere]">
									https://aurlemon.top/favicon.ico
								</dd>
							</dl>
						</template>
					</UAlert>
					<div v-if="currentUser" class="space-y-4">
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
								{{ t('social.friendLinks.fields.note') }}
							</label>
							<UTextarea
								v-model="form.note"
								class="w-full"
								:rows="3"
								maxlength="2000"
								:placeholder="t('social.friendLinks.fields.notePlaceholder')"
							/>
						</div>
						<div class="space-y-2">
							<label class="block text-sm text-slate-700 dark:text-slate-300">
								{{ t('social.friendLinks.fields.image') }}
							</label>
							<input
								ref="fileInputRef"
								type="file"
								accept="image/*"
								class="hidden"
								@change="handleFileChange"
							/>
							<div class="flex min-w-0 items-center gap-3">
								<UButton
									size="sm"
									color="neutral"
									variant="soft"
									icon="i-lucide-image-plus"
									class="shrink-0"
									@click="openFilePicker"
								>
									{{ t('social.friendLinks.fields.chooseImage') }}
								</UButton>
								<p
									class="min-w-0 text-xs leading-5 [overflow-wrap:anywhere]"
									:class="
										selectedImageName
											? 'text-slate-500 dark:text-slate-400'
											: 'text-slate-400 dark:text-slate-500'
									"
								>
									{{
										selectedImageName ||
										t('social.friendLinks.fields.noFileSelected')
									}}
								</p>
							</div>
							<img
								v-if="form.imageBase64"
								:src="form.imageBase64"
								alt="preview"
								class="h-20 w-20 rounded-xl object-cover"
							/>
						</div>
					</div>
				</div>
			</AnimatedModalBody>
		</template>

		<template #footer>
			<AccountStatusBar class="min-w-0 flex-1" compact />
			<div class="flex shrink-0 justify-end gap-3">
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
import AccountStatusBar from '~/components/common/AccountStatusBar.vue'

const open = defineModel<boolean>('open', { default: false })

const emit = defineEmits<{
	'open-admin': []
	submitted: []
}>()
const { t } = useI18n({ useScope: 'global' })
const auth = useAuth()
const { showAuthRequired, showError } = useSocialFeedback()
const { normalizeImage } = useFriendLinkImage()

const submitting = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)
const selectedImageName = ref('')
const currentUser = computed(() => auth.user.value)
const form = reactive({
	name: '',
	url: '',
	desc: '',
	note: '',
	imageBase64: '',
})

const resetForm = () => {
	form.name = ''
	form.url = ''
	form.desc = ''
	form.note = ''
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
				note: form.note.trim() || null,
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
