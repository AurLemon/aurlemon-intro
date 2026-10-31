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
			<AnimatedModalBody :animate-content="false">
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
					<UForm
						v-if="currentUser"
						:id="formId"
						ref="applicationForm"
						:state="form"
						:validate="validate"
						class="space-y-4"
						novalidate
						@submit="submit"
						@error="focusFirstError"
					>
						<p
							v-if="formErrorKey"
							ref="formErrorAlert"
							tabindex="-1"
							role="alert"
							class="friend-form-error text-sm text-error"
						>
							{{ t(formErrorKey) }}
						</p>
						<UFormField
							name="name"
							:ui="{ error: 'friend-form-error' }"
							:label="t('social.friendLinks.fields.name')"
							required
						>
							<UInput
								v-model="form.name"
								required
								class="w-full"
								:placeholder="t('social.friendLinks.fields.name')"
							/>
						</UFormField>
						<UFormField
							name="url"
							:ui="{ error: 'friend-form-error' }"
							:label="t('social.friendLinks.fields.url')"
							required
						>
							<UInput
								v-model="form.url"
								required
								type="url"
								autocomplete="url"
								class="w-full"
								:placeholder="t('social.friendLinks.fields.url')"
							/>
						</UFormField>
						<UFormField
							name="desc"
							:ui="{ error: 'friend-form-error' }"
							:label="t('social.friendLinks.fields.desc')"
							required
						>
							<UTextarea
								v-model="form.desc"
								required
								class="w-full"
								:rows="4"
								:placeholder="t('social.friendLinks.fields.desc')"
							/>
						</UFormField>
						<UFormField
							name="note"
							:ui="{ error: 'friend-form-error' }"
							:label="t('social.friendLinks.fields.note')"
						>
							<UTextarea
								v-model="form.note"
								class="w-full"
								:rows="3"
								maxlength="2000"
								:placeholder="t('social.friendLinks.fields.notePlaceholder')"
							/>
						</UFormField>
						<UFormField
							v-slot="{ error }"
							name="imageBase64"
							:help="t('social.friendLinks.fields.imageHint')"
							:ui="{ error: 'friend-form-error' }"
							:label="t('social.friendLinks.fields.image')"
							:error="imageErrorKey ? t(imageErrorKey) : undefined"
						>
							<input
								ref="fileInputRef"
								type="file"
								:accept="FRIEND_LINK_IMAGE_ACCEPT"
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
									data-image-picker
									:aria-invalid="Boolean(error)"
									:loading="processingImage"
									@click="openFilePicker"
								>
									{{ t('social.friendLinks.fields.chooseImage') }}
								</UButton>
								<UButton
									v-if="form.imageBase64 || imageErrorKey"
									color="neutral"
									variant="ghost"
									icon="i-lucide-x"
									:aria-label="t('social.actions.delete')"
									:disabled="processingImage"
									@click="clearImage"
								/>
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
								class="mt-3 h-20 w-20 rounded-xl object-cover"
							/>
						</UFormField>
					</UForm>
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
					:disabled="!currentUser || processingImage"
					color="primary"
					type="submit"
					:form="formId"
				>
					{{ t('social.actions.submitApplication') }}
				</UButton>
			</div>
		</template>
	</UModal>
</template>

<script setup lang="ts">
import type { FormError } from '@nuxt/ui'
import { FRIEND_LINK_IMAGE_ACCEPT } from '~/shared/utils/friend-link-image'
import AuthActionGuard from '~/components/common/AuthActionGuard.vue'
import AccountStatusBar from '~/components/common/AccountStatusBar.vue'

const open = defineModel<boolean>('open', { default: false })

const emit = defineEmits<{
	'open-admin': []
	submitted: []
}>()
const { t } = useI18n({ useScope: 'global' })
const auth = useAuth()
const { normalizeImage } = useFriendLinkImage()

interface ApplicationFormState {
	name: string
	url: string
	desc: string
	note: string
	imageBase64: string
}
const formId = useId()
const applicationForm = useTemplateRef('applicationForm')
const formErrorAlert = useTemplateRef('formErrorAlert')
const formErrorKey = ref('')
const imageErrorKey = ref('')
const processingImage = ref(false)
const submitting = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)
const selectedImageName = ref('')
const currentUser = computed(() => auth.user.value)
const form = reactive<ApplicationFormState>({
	name: '',
	url: '',
	desc: '',
	note: '',
	imageBase64: '',
})

const validate = (state: ApplicationFormState): FormError[] => {
	const errors: FormError[] = []
	for (const [name, max] of [
		['name', 120],
		['desc', 300],
	] as const) {
		const field = t(`social.friendLinks.fields.${name}`)
		if (!state[name].trim())
			errors.push({
				name,
				message: t('social.friendLinks.validation.required', { field }),
			})
		else if (state[name].trim().length > max)
			errors.push({
				name,
				message: t('social.friendLinks.validation.tooLong', { field, max }),
			})
	}
	let validUrl = false
	try {
		const url = new URL(state.url.trim())
		validUrl =
			['http:', 'https:'].includes(url.protocol) &&
			state.url.trim().length <= 500
	} catch {
		/* Invalid URLs are reported under the URL field. */
	}
	if (!validUrl)
		errors.push({
			name: 'url',
			message: state.url.trim()
				? t('social.errors.invalidFriendLinkUrl')
				: t('social.friendLinks.validation.required', {
						field: t('social.friendLinks.fields.url'),
					}),
		})
	if (state.note.trim().length > 2000)
		errors.push({
			name: 'note',
			message: t('social.errors.invalidFriendLinkNote'),
		})
	if (imageErrorKey.value)
		errors.push({ name: 'imageBase64', message: t(imageErrorKey.value) })
	return errors
}

const focusFirstError = async () => {
	await nextTick()
	document
		.getElementById(formId)
		?.querySelector<HTMLElement>(
			'input[aria-invalid="true"]:not([type="file"]), textarea[aria-invalid="true"], button[aria-invalid="true"]',
		)
		?.focus()
}

const clearImage = () => {
	form.imageBase64 = ''
	selectedImageName.value = ''
	imageErrorKey.value = ''
	if (fileInputRef.value) fileInputRef.value.value = ''
	applicationForm.value?.clear('imageBase64')
}

const errorFields: Record<string, keyof ApplicationFormState> = {
	'social.errors.invalidFriendLinkName': 'name',
	'social.errors.invalidFriendLinkUrl': 'url',
	'social.errors.friendLinkAlreadyExists': 'url',
	'social.errors.invalidFriendLinkDesc': 'desc',
	'social.errors.invalidFriendLinkNote': 'note',
	'social.errors.unsupportedFriendLinkImageFormat': 'imageBase64',
	'social.errors.invalidImageBase64': 'imageBase64',
	'social.errors.imageTooLarge': 'imageBase64',
}

const resetForm = () => {
	applicationForm.value?.clear()
	formErrorKey.value = ''
	clearImage()
	form.name = ''
	form.url = ''
	form.desc = ''
	form.note = ''
}

const handleFileChange = async (event: Event) => {
	const input = event.target as HTMLInputElement
	const file = input.files?.[0]

	if (!file) {
		return
	}

	processingImage.value = true
	imageErrorKey.value = ''
	applicationForm.value?.clear('imageBase64')
	try {
		form.imageBase64 = await normalizeImage(file)
		selectedImageName.value = file.name
	} catch (error) {
		clearImage()
		imageErrorKey.value = resolveSocialErrorKey(
			error instanceof Error ? { statusMessage: error.message } : error,
		)
	} finally {
		processingImage.value = false
	}
}

const openFilePicker = () => {
	fileInputRef.value?.click()
}

const submit = async () => {
	if (!auth.isLoggedIn.value) {
		formErrorKey.value = 'social.errors.authRequired'
		return
	}

	if (submitting.value || processingImage.value) return
	formErrorKey.value = ''
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
		const key = resolveSocialErrorKey(error)
		const field = errorFields[key]
		if (field) {
			applicationForm.value?.setErrors(
				[{ name: field, message: t(key) }],
				field,
			)
			await focusFirstError()
		} else formErrorKey.value = key
	} finally {
		submitting.value = false
	}
}

watch(formErrorKey, async (key) => {
	if (!key) return
	await nextTick()
	formErrorAlert.value?.focus()
})

watch(open, (value) => {
	if (value) {
		void auth.ensureReady()
	}
})
</script>

<style scoped>
:deep(.friend-form-error) {
	animation: friend-form-error-enter 160ms ease-out;
}

@keyframes friend-form-error-enter {
	from {
		opacity: 0;
		transform: translateY(-2px);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

@media (prefers-reduced-motion: reduce) {
	:deep(.friend-form-error) {
		animation: none;
	}
}
</style>
