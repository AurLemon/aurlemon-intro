<template>
	<UModal
		v-model:open="open"
		:title="t('social.friendLinks.adminTitle')"
		@enter="modalHeight.start"
		class="max-w-2xl"
		:ui="{
			overlay: 'z-[42000]',
			content:
				'z-[42010] transition-[height] duration-300 ease-out motion-reduce:transition-none',
			header: 'gap-2 pr-14 sm:pr-14',
			wrapper: 'min-w-0 flex-1',
			body: 'p-4 sm:p-5',
		}"
	>
		<template #actions>
			<div
				v-if="currentUser?.isAdmin"
				class="flex shrink-0 items-center gap-1.5"
			>
				<UButton
					size="xs"
					color="neutral"
					variant="soft"
					icon="i-lucide-refresh-cw"
					:aria-label="t('social.friendLinks.covers.refreshAll')"
					:loading="refreshingCover === '*'"
					:disabled="
						!coverAdmin?.browserAvailable ||
						coversQueued ||
						refreshingCover !== null
					"
					@click="refreshCovers()"
				>
					<span class="hidden sm:inline">{{
						t('social.friendLinks.covers.refreshAll')
					}}</span>
				</UButton>
				<UButton
					size="xs"
					color="primary"
					icon="i-lucide-plus"
					:aria-label="t('social.friendLinks.createTitle')"
					@click="startCreate"
				>
					<span class="hidden sm:inline">{{
						t('social.friendLinks.createTitle')
					}}</span
					><span class="sm:hidden">{{ t('social.friendLinks.add') }}</span>
				</UButton>
			</div>
		</template>
		<template #body>
			<div ref="managementBody">
				<AuthActionGuard
					v-if="!currentUser?.isAdmin"
					:title="t('social.friendLinks.adminRequiredTitle')"
					:description="t('social.friendLinks.adminRequiredDesc')"
				/>
				<div v-else class="space-y-3">
					<p
						v-if="coverAdmin && !coverAdmin.browserAvailable"
						class="text-xs text-amber-700 dark:text-amber-300"
					>
						{{ t('social.friendLinks.covers.browserMissing') }}
					</p>
					<p
						v-if="loadingItems && !items.length"
						class="py-6 text-center text-sm text-slate-500"
					>
						{{ t('social.friendLinks.loading') }}
					</p>
					<p
						v-else-if="!items.length"
						class="py-6 text-center text-sm text-slate-500"
					>
						{{ t('social.friendLinks.emptyLinks') }}
					</p>
					<article
						v-for="item in items"
						:key="`${item.type}-${item.id}`"
						:id="`friend-link-item-${item.id}`"
						class="space-y-3 rounded-xl border border-slate-200/80 p-3 sm:p-4 dark:border-slate-800"
						:class="isFocused(item) ? 'ring-2 ring-primary-400' : ''"
					>
						<div class="flex items-start gap-3">
							<UAvatar
								:as="{ img: SkeletonImage }"
								image-class="size-full object-cover"
								:src="item.imageBase64 || undefined"
								:alt="item.name"
								class="size-10 shrink-0 sm:size-11"
								:class="
									item.iconRounded === false
										? 'rounded-none'
										: 'rounded-lg border border-slate-300/80 dark:border-slate-600/80'
								"
								:ui="{
									root: 'overflow-hidden bg-transparent',
									image: 'size-full rounded-none',
								}"
							/>
							<div class="min-w-0 flex-1">
								<h3
									class="text-sm font-semibold leading-5 text-slate-900 [overflow-wrap:anywhere] dark:text-slate-100"
								>
									{{ item.name }}
								</h3>
								<div class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
									<UBadge
										size="xs"
										:color="
											item.type === 'pending-application'
												? 'warning'
												: 'neutral'
										"
										variant="soft"
										>{{
											t(`social.friendLinks.origins.${item.origin}`)
										}}</UBadge
									>
									<FriendLinkAccountLabel
										v-for="account in ownerAccounts(item)"
										:key="account.providers[0]"
										:applicant="account"
									/>
								</div>
								<p
									class="mt-1.5 text-sm leading-5 text-slate-600 [overflow-wrap:anywhere] dark:text-slate-300"
								>
									{{ item.desc }}
								</p>
								<a
									:href="item.url"
									target="_blank"
									rel="noopener noreferrer"
									class="mt-1 block text-xs leading-5 text-primary-600 [overflow-wrap:anywhere] dark:text-primary-300"
									>{{ item.url }}</a
								>
							</div>
						</div>
						<div
							v-if="item.type === 'friend-link' && coversById.get(item.id)"
							class="space-y-2 pl-13 sm:pl-14"
						>
							<div
								v-if="
									coversById.get(item.id)?.coverUrl ||
									coversById.get(item.id)?.mobileCoverUrl
								"
								class="flex items-start gap-3"
							>
								<figure
									v-if="coversById.get(item.id)?.coverUrl"
									class="min-w-0"
								>
									<SkeletonImage
										:src="coversById.get(item.id)?.coverUrl ?? ''"
										alt=""
										loading="lazy"
										class="aspect-[1440/900] h-20 overflow-hidden rounded-md border border-slate-200/60 dark:border-slate-700/60"
										:image-class="'h-full w-full object-contain'"
									/>
									<figcaption
										class="mt-1 whitespace-nowrap text-left text-[11px] leading-4 text-slate-500 dark:text-slate-400"
									>
										{{ t('social.friendLinks.covers.desktop') }}
									</figcaption>
								</figure>
								<figure
									v-if="coversById.get(item.id)?.mobileCoverUrl"
									class="min-w-0"
								>
									<SkeletonImage
										:src="coversById.get(item.id)?.mobileCoverUrl ?? ''"
										alt=""
										loading="lazy"
										class="aspect-[390/680] h-20 overflow-hidden rounded-md border border-slate-200/60 dark:border-slate-700/60"
										:image-class="'h-full w-full object-contain'"
									/>
									<figcaption
										class="mt-1 whitespace-nowrap text-left text-[11px] leading-4 text-slate-500 dark:text-slate-400"
									>
										{{ t('social.friendLinks.covers.mobile') }}
									</figcaption>
								</figure>
							</div>
							<div
								class="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs"
							>
								<span
									class="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400"
								>
									<UIcon
										:name="coverStateIcons[coversById.get(item.id)!.status]"
										class="size-3.5 -translate-y-px shrink-0 motion-reduce:animate-none"
										:class="{
											'animate-spin':
												coversById.get(item.id)?.status === 'queued',
										}"
									/>
									{{
										t(
											`social.friendLinks.covers.states.${coversById.get(item.id)!.status}`,
										)
									}}
								</span>
								<div
									v-if="coversById.get(item.id)?.capturedAt"
									class="flex items-center gap-1.5 text-slate-500 dark:text-slate-400"
								>
									<span>{{ t('social.friendLinks.covers.updatedAt') }}</span
									><time :datetime="coversById.get(item.id)!.capturedAt!">{{
										formatCoverDate(coversById.get(item.id)!.capturedAt!)
									}}</time>
								</div>
							</div>
						</div>
						<div class="flex flex-wrap items-center gap-1">
							<div class="ml-auto flex items-center gap-1">
								<UButton
									v-if="item.type === 'pending-application'"
									size="xs"
									color="primary"
									:loading="approvingId === item.id"
									@click="approve(item.id)"
									>{{ t('social.actions.approve') }}</UButton
								>
								<UButton
									v-else
									size="xs"
									color="neutral"
									variant="ghost"
									icon="i-lucide-refresh-cw"
									:aria-label="t('social.friendLinks.covers.refresh')"
									:disabled="
										!coverAdmin?.browserAvailable ||
										coversById.get(item.id)?.status === 'queued'
									"
									:loading="
										refreshingCover === item.id ||
										coversById.get(item.id)?.status === 'queued'
									"
									@click="refreshCovers(item.id)"
								/>
								<UButton
									v-if="item.application"
									size="xs"
									color="neutral"
									variant="ghost"
									@click="applicationItem = item"
									>{{ t('social.friendLinks.applicationInfo') }}</UButton
								>
								<UButton
									size="xs"
									color="neutral"
									variant="ghost"
									@click="startEdit(item)"
									>{{ t('social.actions.edit') }}</UButton
								>
								<UButton
									size="xs"
									color="error"
									variant="ghost"
									:loading="deletingId === item.id"
									@click="
										item.type === 'pending-application'
											? removeApplication(item.id)
											: remove(item.id)
									"
									>{{ t('social.actions.delete') }}</UButton
								>
							</div>
						</div>
					</article>
				</div>
			</div>
		</template>
	</UModal>
	<UModal
		v-model:open="formOpen"
		@after:leave="finishEditing"
		:title="
			editingApplicationId
				? t('social.friendLinks.editApplicationTitle')
				: editingLinkId
					? t('social.friendLinks.editTitle')
					: t('social.friendLinks.createTitle')
		"
		class="max-w-md"
		:ui="{ overlay: 'z-[42100]', content: 'z-[42110]' }"
	>
		<template #body
			><AnimatedModalBody :animate-content="false"
				><UForm
					:id="adminFormId"
					ref="adminForm"
					:state="form"
					:validate="validate"
					:loading-auto="false"
					class="space-y-4"
					novalidate
					@submit="save"
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
						:label="t('social.friendLinks.fields.name')"
						required
						:ui="{ error: 'friend-form-error' }"
					>
						<UInput
							v-model="form.name"
							required
							:maxlength="120"
							class="w-full"
							:placeholder="t('social.friendLinks.fields.name')"
						/>
					</UFormField>
					<UFormField
						name="url"
						:label="t('social.friendLinks.fields.url')"
						required
						:ui="{ error: 'friend-form-error' }"
					>
						<UInput
							v-model="form.url"
							required
							:maxlength="500"
							class="w-full"
							:placeholder="t('social.friendLinks.fields.url')"
						/>
					</UFormField>
					<UFormField
						name="desc"
						:label="t('social.friendLinks.fields.desc')"
						required
						:ui="{ error: 'friend-form-error' }"
					>
						<UTextarea
							v-model="form.desc"
							required
							:maxlength="300"
							class="w-full"
							:rows="4"
							:placeholder="t('social.friendLinks.fields.desc')"
						/>
					</UFormField>
					<FriendLinkOwnerInput
						v-if="formOpen"
						v-model="form.ownerGithubLogin"
						provider="GITHUB"
						@pending="ownerGithubPending = $event" />
					<FriendLinkOwnerInput
						v-if="formOpen"
						v-model="form.ownerLinuxDoUsername"
						provider="LINUX_DO"
						@pending="ownerLinuxDoPending = $event" />
					<UFormField
						name="imageBase64"
						:label="t('social.friendLinks.fields.image')"
						:help="t('social.friendLinks.fields.imageHint')"
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
								:loading="processingImage"
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
						<SkeletonImage
							v-if="form.imageBase64"
							:src="form.imageBase64"
							alt="preview"
							class="mt-3 h-20 w-20 overflow-hidden"
							image-class="size-full object-cover"
							:class="
								form.iconRounded
									? 'rounded-xl border border-slate-300/80 dark:border-slate-600/80'
									: 'rounded-none'
							"
						/>
					</UFormField>
					<USwitch
						v-if="editingLinkId"
						:model-value="!form.iconRounded"
						:label="t('social.friendLinks.fields.disableIconRounded')"
						@update:model-value="
							form.iconRounded = !$event
						" /></UForm></AnimatedModalBody
		></template>
		<template #footer>
			<div class="flex w-full justify-end gap-2">
				<UButton color="neutral" variant="ghost" @click="cancelEdit">{{
					t('social.actions.close')
				}}</UButton>
				<UButton
					:loading="saving"
					:disabled="
						processingImage || ownerGithubPending || ownerLinuxDoPending
					"
					color="primary"
					type="submit"
					:form="adminFormId"
					>{{
						editingApplicationId
							? t('social.actions.approve')
							: editingLinkId
								? t('social.actions.saveEdit')
								: t('social.actions.createFriendLink')
					}}</UButton
				>
			</div>
		</template>
	</UModal>
	<UModal
		:open="Boolean(applicationItem)"
		:title="t('social.friendLinks.applicationInfo')"
		class="max-w-lg"
		:ui="{ overlay: 'z-[42200]', content: 'z-[42210]' }"
		@update:open="
			(value) => {
				if (!value) applicationItem = null
			}
		"
	>
		<template #body>
			<AnimatedModalBody v-if="applicationItem?.application">
				<div class="space-y-4">
					<div class="flex items-center gap-3">
						<UAvatar
							:as="{ img: SkeletonImage }"
							image-class="size-full object-cover"
							:ui="{
								root: 'overflow-hidden bg-transparent',
								image: 'size-full rounded-none',
							}"
							:src="applicationItem.application.imageBase64 || undefined"
							:alt="applicationItem.application.name"
							class="size-12 shrink-0 rounded-lg"
						/>
						<div class="min-w-0">
							<p class="text-sm font-semibold [overflow-wrap:anywhere]">
								{{ applicationItem.application.name }}
							</p>
							<FriendLinkAccountLabel
								v-if="applicationItem.applicant"
								class="mt-1"
								:applicant="applicationItem.applicant"
							/>
						</div>
					</div>
					<dl class="space-y-3 text-sm">
						<div>
							<dt class="mb-1 text-xs text-slate-500 dark:text-slate-400">
								{{ t('social.friendLinks.fields.url') }}
							</dt>
							<dd>
								<a
									:href="applicationItem.application.url"
									target="_blank"
									rel="noopener noreferrer"
									class="text-primary-600 [overflow-wrap:anywhere] dark:text-primary-300"
									>{{ applicationItem.application.url }}</a
								>
							</dd>
						</div>
						<div>
							<dt class="mb-1 text-xs text-slate-500 dark:text-slate-400">
								{{ t('social.friendLinks.fields.desc') }}
							</dt>
							<dd class="whitespace-pre-wrap [overflow-wrap:anywhere]">
								{{ applicationItem.application.desc }}
							</dd>
						</div>
						<div
							v-if="applicationItem.application.note"
							class="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/60"
						>
							<dt
								class="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400"
							>
								{{ t('social.friendLinks.fields.note') }}
							</dt>
							<dd class="whitespace-pre-wrap [overflow-wrap:anywhere]">
								{{ applicationItem.application.note }}
							</dd>
						</div>
						<div>
							<dt class="mb-1 text-xs text-slate-500 dark:text-slate-400">
								{{ t('social.friendLinks.submittedAt') }}
							</dt>
							<dd>
								<time :datetime="applicationItem.application.createdAt">{{
									formatApplicationDate(applicationItem.application.createdAt)
								}}</time>
							</dd>
						</div>
						<div v-if="applicationItem.application.approvedAt">
							<dt class="mb-1 text-xs text-slate-500 dark:text-slate-400">
								{{ t('social.friendLinks.approvedAt') }}
							</dt>
							<dd>
								<time :datetime="applicationItem.application.approvedAt">{{
									formatApplicationDate(applicationItem.application.approvedAt)
								}}</time>
							</dd>
						</div>
					</dl>
				</div>
			</AnimatedModalBody>
		</template>
	</UModal>
</template>

<script setup lang="ts">
import type { FormError } from '@nuxt/ui'
import { FRIEND_LINK_IMAGE_ACCEPT } from '~/shared/utils/friend-link-image'
import type {
	FriendLinkCoverAdminResponse,
	FriendLinkCoverState,
} from '~/shared/types/friend-link-cover'
import SkeletonImage from '~/components/common/SkeletonImage.vue'
import FriendLinkOwnerInput from './FriendLinkOwnerInput.vue'
import FriendLinkAccountLabel from './FriendLinkAccountLabel.vue'
import AuthActionGuard from '~/components/common/AuthActionGuard.vue'
import type {
	AdminFriendLinkListItem,
	FriendLinkApplicant,
} from '~/shared/types/social'

const open = defineModel<boolean>('open', { default: false })
const managementBody = useTemplateRef('managementBody')
const modalHeight = useModalHeightTransition(managementBody)

const emit = defineEmits<{
	updated: []
}>()

const { t, locale } = useI18n({ useScope: 'global' })
const auth = useAuth()
const route = useRoute()
const router = useRouter()
const { showError } = useSocialFeedback()
const { normalizeImage } = useFriendLinkImage()

const ownerAccounts = (
	item: AdminFriendLinkListItem,
): FriendLinkApplicant[] => {
	const accounts: FriendLinkApplicant[] = []
	if (item.ownerGithubLogin)
		accounts.push({
			username: item.ownerGithubLogin,
			displayName: item.ownerGithubLogin,
			providers: ['GITHUB'],
		})
	if (item.ownerLinuxDoUsername)
		accounts.push({
			username: item.ownerLinuxDoUsername,
			displayName: item.ownerLinuxDoUsername,
			providers: ['LINUX_DO'],
		})
	return accounts
}

const items = ref<AdminFriendLinkListItem[]>([])
const approvingId = ref<string | null>(null)
const deletingId = ref<string | null>(null)
const saving = ref(false)
const loadingItems = ref(false)
const formOpen = ref(false)
const applicationItem = ref<AdminFriendLinkListItem | null>(null)
let itemLoadGeneration = 0
let focusTimer: ReturnType<typeof setTimeout> | undefined
const fileInputRef = ref<HTMLInputElement | null>(null)
const selectedImageName = ref('')
const imageErrorKey = ref('')
const processingImage = ref(false)
const editingLinkId = ref<string | null>(null)
const editingApplicationId = ref<string | null>(null)
const currentUser = computed(() => auth.user.value)
const focusedApplicationId = ref<string | null>(null)
const ownerGithubPending = ref(false)
const ownerLinuxDoPending = ref(false)
interface AdminFriendLinkFormState {
	ownerGithubLogin: string
	ownerLinuxDoUsername: string
	name: string
	url: string
	desc: string
	imageBase64: string
	iconRounded: boolean
}
const adminFormId = useId()
const adminForm = useTemplateRef('adminForm')
const formErrorAlert = useTemplateRef('formErrorAlert')
const formErrorKey = ref('')
const form = reactive<AdminFriendLinkFormState>({
	ownerGithubLogin: '',
	ownerLinuxDoUsername: '',
	name: '',
	url: '',
	desc: '',
	imageBase64: '',
	iconRounded: true,
})

const validate = (state: AdminFriendLinkFormState): FormError[] => {
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
	if (imageErrorKey.value)
		errors.push({ name: 'imageBase64', message: t(imageErrorKey.value) })
	return errors
}

const focusFirstError = async () => {
	await nextTick()
	document
		.getElementById(adminFormId)
		?.querySelector<HTMLElement>(
			'input[aria-invalid="true"]:not([type="file"]), textarea[aria-invalid="true"], button[aria-invalid="true"]',
		)
		?.focus()
}

const errorFields: Record<string, keyof AdminFriendLinkFormState> = {
	'social.errors.invalidFriendLinkName': 'name',
	'social.errors.invalidFriendLinkUrl': 'url',
	'social.errors.friendLinkAlreadyExists': 'url',
	'social.errors.invalidFriendLinkDesc': 'desc',
	'social.errors.unsupportedFriendLinkImageFormat': 'imageBase64',
	'social.errors.invalidImageBase64': 'imageBase64',
	'social.errors.imageTooLarge': 'imageBase64',
}

const resetForm = () => {
	adminForm.value?.clear()
	formErrorKey.value = ''
	imageErrorKey.value = ''
	form.ownerGithubLogin = ''
	form.ownerLinuxDoUsername = ''
	form.name = ''
	form.url = ''
	form.desc = ''
	form.imageBase64 = ''
	form.iconRounded = true
	selectedImageName.value = ''
}

const finishEditing = () => {
	if (formOpen.value) return
	editingLinkId.value = null
	editingApplicationId.value = null
	resetForm()
}
const cancelEdit = () => {
	formOpen.value = false
}
const startCreate = () => {
	finishEditing()
	formOpen.value = true
}
const isFocused = (item: AdminFriendLinkListItem) =>
	item.id === focusedApplicationId.value ||
	item.application?.id === focusedApplicationId.value
const loadItems = async () => {
	if (!auth.user.value?.isAdmin) {
		return
	}

	const generation = ++itemLoadGeneration
	loadingItems.value = true
	try {
		const response = await $fetch<{ items: AdminFriendLinkListItem[] }>(
			'/api/friend-links/admin/items',
		)
		if (!open.value || generation !== itemLoadGeneration) return
		items.value = response.items
		await loadCoverState()
		if (focusedApplicationId.value) {
			await nextTick()
			const focused = items.value.find(isFocused)
			document
				.getElementById(`friend-link-item-${focused?.id}`)
				?.scrollIntoView({ behavior: 'smooth', block: 'center' })
			const query = { ...route.query }
			delete query.application
			await router.replace({ query })
			clearTimeout(focusTimer)
			focusTimer = setTimeout(() => {
				focusedApplicationId.value = null
			}, 4000)
		}
	} catch (error) {
		showError(error)
	} finally {
		if (generation === itemLoadGeneration) loadingItems.value = false
	}
}

const coverStateIcons: Record<FriendLinkCoverState['status'], string> = {
	ready: 'i-lucide-circle-check',
	partial: 'i-lucide-circle-dashed',
	fallback: 'i-lucide-image-off',
	failed: 'i-lucide-circle-alert',
	queued: 'i-lucide-loader-circle',
}
const coverAdmin = ref<FriendLinkCoverAdminResponse | null>(null)
const refreshingCover = ref<string | null>(null)
const coversById = computed(
	() => new Map(coverAdmin.value?.items.map((item) => [item.id, item]) ?? []),
)
const coversQueued = computed(
	() =>
		coverAdmin.value?.items.some((item) => item.status === 'queued') ?? false,
)
let coverPoll: ReturnType<typeof setTimeout> | undefined
const clearCoverPoll = () => {
	clearTimeout(coverPoll)
	coverPoll = undefined
}
const formatCoverDate = (value: string) =>
	new Intl.DateTimeFormat(locale.value, { dateStyle: 'medium' }).format(
		new Date(value),
	)
const formatApplicationDate = (value: string) =>
	new Intl.DateTimeFormat(locale.value, {
		dateStyle: 'medium',
		timeStyle: 'short',
	}).format(new Date(value))
const loadCoverState = async () => {
	clearCoverPoll()
	if (!open.value || !currentUser.value?.isAdmin) return
	const hadQueued = coversQueued.value
	const response = await $fetch<FriendLinkCoverAdminResponse>(
		'/api/friend-links/admin/covers',
	)
	if (!open.value) return
	coverAdmin.value = response
	if (coversQueued.value) {
		coverPoll = setTimeout(() => void loadCoverState().catch(showError), 5000)
	}
	if (hadQueued && !coversQueued.value) emit('updated')
}
const refreshCovers = async (id?: string) => {
	refreshingCover.value = id ?? '*'
	try {
		await $fetch('/api/friend-links/admin/covers', {
			method: 'POST',
			body: id ? { id } : {},
		})
		await loadCoverState()
	} catch (error) {
		showError(error)
	} finally {
		refreshingCover.value = null
	}
}
onBeforeUnmount(() => {
	clearCoverPoll()
	clearTimeout(focusTimer)
})

const handleFileChange = async (event: Event) => {
	const input = event.target as HTMLInputElement
	const file = input.files?.[0]

	if (!file) {
		return
	}

	imageErrorKey.value = ''
	adminForm.value?.clear('imageBase64')
	processingImage.value = true
	try {
		form.imageBase64 = await normalizeImage(file)
		selectedImageName.value = file.name
	} catch (error) {
		input.value = ''
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

const approve = async (applicationId: string) => {
	approvingId.value = applicationId

	try {
		await $fetch(
			`/api/friend-links/admin/applications/${applicationId}/approve`,
			{
				method: 'POST',
			},
		)
		await loadItems()
		emit('updated')
	} catch (error) {
		showError(error)
	} finally {
		approvingId.value = null
	}
}

const startEdit = (item: AdminFriendLinkListItem) => {
	adminForm.value?.clear()
	formErrorKey.value = ''
	imageErrorKey.value = ''
	formOpen.value = true
	editingLinkId.value = item.type === 'friend-link' ? item.id : null
	editingApplicationId.value =
		item.type === 'pending-application' ? item.id : null
	form.ownerGithubLogin = item.ownerGithubLogin ?? ''
	form.ownerLinuxDoUsername = item.ownerLinuxDoUsername ?? ''
	form.name = item.name
	form.url = item.url
	form.desc = item.desc
	form.imageBase64 = item.imageBase64
	form.iconRounded = item.iconRounded ?? true
	selectedImageName.value = t('social.friendLinks.fields.keepCurrentImage')
}

const removeApplication = async (applicationId: string) => {
	deletingId.value = applicationId

	try {
		await $fetch(`/api/friend-links/admin/applications/${applicationId}`, {
			method: 'DELETE',
		})
		if (editingApplicationId.value === applicationId) {
			cancelEdit()
		}
		await loadItems()
		emit('updated')
	} catch (error) {
		showError(error)
	} finally {
		deletingId.value = null
	}
}

const remove = async (friendLinkId: string) => {
	deletingId.value = friendLinkId

	try {
		await $fetch(`/api/friend-links/admin/links/${friendLinkId}`, {
			method: 'DELETE',
		})
		if (editingLinkId.value === friendLinkId) {
			cancelEdit()
		}
		await loadItems()
		emit('updated')
	} catch (error) {
		showError(error)
	} finally {
		deletingId.value = null
	}
}

const save = async () => {
	if (
		saving.value ||
		processingImage.value ||
		ownerGithubPending.value ||
		ownerLinuxDoPending.value
	)
		return
	if (!auth.user.value?.isAdmin) {
		formErrorKey.value = resolveSocialErrorKey({
			statusMessage: 'ADMIN_REQUIRED',
		})
		return
	}

	formErrorKey.value = ''
	saving.value = true

	try {
		if (editingApplicationId.value) {
			await $fetch(
				`/api/friend-links/admin/applications/${editingApplicationId.value}/approve`,
				{
					method: 'POST',
					body: {
						ownerGithubLogin: form.ownerGithubLogin,
						ownerLinuxDoUsername: form.ownerLinuxDoUsername,
						name: form.name,
						url: form.url,
						desc: form.desc,
						imageBase64:
							typeof form.imageBase64 === 'string' &&
							form.imageBase64.startsWith('data:image/')
								? form.imageBase64
								: null,
					},
				},
			)
		} else if (editingLinkId.value) {
			await $fetch(`/api/friend-links/admin/links/${editingLinkId.value}`, {
				method: 'PATCH',
				body: {
					iconRounded: form.iconRounded,
					ownerGithubLogin: form.ownerGithubLogin,
					ownerLinuxDoUsername: form.ownerLinuxDoUsername,
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
		} else {
			await $fetch('/api/friend-links/admin/create', {
				method: 'POST',
				body: {
					ownerGithubLogin: form.ownerGithubLogin,
					ownerLinuxDoUsername: form.ownerLinuxDoUsername,
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
		}

		cancelEdit()
		await loadItems()
		emit('updated')
	} catch (error) {
		const key = resolveSocialErrorKey(error)
		const field = errorFields[key]
		if (field) {
			if (field === 'imageBase64') imageErrorKey.value = key
			adminForm.value?.setErrors([{ name: field, message: t(key) }])
			await focusFirstError()
		} else {
			formErrorKey.value = key
			await nextTick()
			formErrorAlert.value?.focus()
		}
	} finally {
		saving.value = false
	}
}

watch([open, () => currentUser.value?.isAdmin], async ([isOpen, isAdmin]) => {
	clearCoverPoll()
	if (!isOpen) {
		modalHeight.stop()
		itemLoadGeneration++
		loadingItems.value = false
		clearTimeout(focusTimer)
		cancelEdit()
		applicationItem.value = null
		return
	}
	if (!isAdmin) {
		await auth.ensureReady()
		return
	}
	focusedApplicationId.value =
		typeof route.query.application === 'string' ? route.query.application : null
	await loadItems()
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
