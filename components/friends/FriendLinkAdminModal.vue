<template>
	<UModal
		v-model:open="open"
		:title="t('social.friendLinks.adminTitle')"
		class="max-w-4xl"
		scrollable
		:ui="{
			overlay: 'z-[42000]',
			content: 'z-[42010]',
		}"
	>
		<template #body>
			<div class="space-y-6">
				<AuthActionGuard
					v-if="!currentUser?.isAdmin"
					:title="t('social.friendLinks.adminRequiredTitle')"
					:description="t('social.friendLinks.adminRequiredDesc')"
				/>
				<div v-else class="grid gap-6 lg:grid-cols-2">
					<div class="space-y-4">
						<h3
							class="text-sm font-semibold text-slate-900 dark:text-slate-100"
						>
							{{ t('social.friendLinks.listTitle') }}
						</h3>
						<UAlert
							v-if="!items.length"
							color="neutral"
							variant="soft"
							:title="t('social.friendLinks.pendingEmptyTitle')"
						/>
						<div v-else class="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
							<div
								v-for="item in items"
								:key="`${item.type}-${item.id}`"
								class="rounded-2xl border border-slate-200/70 p-4 dark:border-slate-800"
							>
								<div class="flex items-start gap-4">
									<img
										:src="item.imageBase64"
										:alt="item.name"
										class="h-14 w-14 rounded-xl object-cover"
									/>
									<div class="min-w-0 flex-1 space-y-2">
										<div class="flex flex-wrap items-center gap-2">
											<h4
												class="text-base font-semibold text-slate-900 dark:text-slate-100"
											>
												{{ item.name }}
											</h4>
											<UBadge
												v-if="item.type === 'pending-application'"
												color="warning"
												variant="soft"
											>
												{{ t('social.friendLinks.status.pending') }}
											</UBadge>
										</div>
										<p class="text-sm text-slate-600 dark:text-slate-300">
											{{ item.desc }}
										</p>
										<a
											:href="item.url"
											target="_blank"
											rel="noopener noreferrer"
											class="text-sm text-primary-600 dark:text-primary-300 break-all"
										>
											{{ item.url }}
										</a>
										<UButton
											v-if="item.applicantGithubLogin"
											size="xs"
											color="neutral"
											variant="link"
											:to="`https://github.com/${item.applicantGithubLogin}`"
											target="_blank"
										>
											{{ item.applicantGithubLogin }}
										</UButton>
										<div class="flex justify-end gap-2">
											<UButton
												v-if="item.type === 'pending-application'"
												size="xs"
												color="primary"
												:loading="approvingId === item.id"
												@click="approve(item.id)"
											>
												{{ t('social.actions.approve') }}
											</UButton>
											<template v-else>
												<UButton
													size="xs"
													color="neutral"
													variant="ghost"
													@click="startEdit(item)"
												>
													{{ t('social.actions.edit') }}
												</UButton>
												<UButton
													size="xs"
													color="error"
													variant="ghost"
													:loading="deletingId === item.id"
													@click="remove(item.id)"
												>
													{{ t('social.actions.delete') }}
												</UButton>
											</template>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>

					<div class="space-y-4">
						<h3
							class="text-sm font-semibold text-slate-900 dark:text-slate-100"
						>
							{{
								editingLinkId
									? t('social.friendLinks.editTitle')
									: t('social.friendLinks.directCreateTitle')
							}}
						</h3>
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
						<div class="flex justify-end gap-2">
							<UButton
								v-if="editingLinkId"
								size="xs"
								color="neutral"
								variant="ghost"
								@click="cancelEdit"
							>
								{{ t('social.actions.cancelEdit') }}
							</UButton>
							<UButton
								size="xs"
								color="primary"
								:loading="saving"
								@click="save"
							>
								{{
									editingLinkId
										? t('social.actions.saveEdit')
										: t('social.actions.createFriendLink')
								}}
							</UButton>
						</div>
					</div>
				</div>
			</div>
		</template>
	</UModal>
</template>

<script setup lang="ts">
import AuthActionGuard from '~/components/common/AuthActionGuard.vue'
import type { AdminFriendLinkListItem } from '~/shared/types/social'

const open = defineModel<boolean>('open', { default: false })

const emit = defineEmits<{
	updated: []
}>()

const { t } = useI18n()
const auth = useGithubAuth()
const { showError } = useSocialFeedback()
const { normalizeImage } = useFriendLinkImage()

const items = ref<AdminFriendLinkListItem[]>([])
const approvingId = ref<string | null>(null)
const deletingId = ref<string | null>(null)
const saving = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)
const selectedImageName = ref('')
const editingLinkId = ref<string | null>(null)
const currentUser = computed(() => auth.user.value)
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

const cancelEdit = () => {
	editingLinkId.value = null
	resetForm()
}

const loadItems = async () => {
	if (!auth.user.value?.isAdmin) {
		return
	}

	try {
		const response = await $fetch<{ items: AdminFriendLinkListItem[] }>(
			'/api/friend-links/admin/items',
		)
		items.value = response.items
	} catch (error) {
		showError(error)
	}
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
	if (item.type !== 'friend-link') {
		return
	}

	editingLinkId.value = item.id
	form.name = item.name
	form.url = item.url
	form.desc = item.desc
	form.imageBase64 = item.imageBase64
	selectedImageName.value = t('social.friendLinks.fields.keepCurrentImage')
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
	if (!auth.user.value?.isAdmin) {
		showError({ statusMessage: 'ADMIN_REQUIRED' })
		return
	}

	saving.value = true

	try {
		if (editingLinkId.value) {
			await $fetch(`/api/friend-links/admin/links/${editingLinkId.value}`, {
				method: 'PATCH',
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
		} else {
			await $fetch('/api/friend-links/admin/create', {
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
		}

		cancelEdit()
		await loadItems()
		emit('updated')
	} catch (error) {
		showError(error)
	} finally {
		saving.value = false
	}
}

watch(open, async (value) => {
	if (!value) {
		return
	}

	await auth.ensureReady()
	await loadItems()
})
</script>
