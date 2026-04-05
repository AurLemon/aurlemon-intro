<template>
	<UModal
		v-model:open="open"
		:title="t('social.message.title')"
		class="max-w-lg"
		scrollable
		:ui="{
			overlay: 'z-[43000]',
			content: 'z-[43010]',
		}"
	>
		<template #body>
			<div class="space-y-5">
				<UAlert
					v-if="!items.length"
					color="neutral"
					variant="soft"
					:title="t('social.message.emptyTitle')"
					:description="t('social.message.emptyDesc')"
				/>
				<div v-else class="space-y-4">
					<MessageThread
						v-for="item in items"
						:key="item.id"
						:item="item"
						:replying-to-id="replyingToId"
						:reply-loading="submitting"
						:editing-id="editingId"
						:editing-loading="editing"
						:deleting-loading="deleting"
						:can-interact="isLoggedIn"
						@like="likeComment"
						@reply="startReply"
						@cancel-reply="cancelReply"
						@submit-reply="submitReply"
						@start-edit="startEdit"
						@cancel-edit="cancelEdit"
						@submit-edit="submitEdit"
						@delete="deleteComment"
					/>
				</div>
				<MessageComposer
					:loading="submitting"
					:disabled="!isLoggedIn"
					@submit="submitRootComment"
				>
					<template #leading>
						<SocialAuthStatusBar compact />
					</template>
					<template #before-submit>
						<UButton
							color="neutral"
							variant="link"
							@click="emit('open-site-like-list')"
						>
							<UIcon name="i-lucide-heart" class="h-4 w-4" />
							{{ t('social.actions.openSiteLikeList') }}
						</UButton>
					</template>
				</MessageComposer>
			</div>
		</template>
	</UModal>
</template>

<script setup lang="ts">
import SocialAuthStatusBar from '~/components/common/SocialAuthStatusBar.vue'
import type {
	MessageBoardResponse,
	MessageCommentItem,
} from '~/shared/types/social'

const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{
	'open-site-like-list': []
}>()

const { t } = useI18n()
const auth = useGithubAuth()
const { showError } = useSocialFeedback()

const items = ref<MessageCommentItem[]>([])
const submitting = ref(false)
const editing = ref(false)
const deleting = ref(false)
const replyTarget = ref<MessageCommentItem | null>(null)
const editingTarget = ref<MessageCommentItem | null>(null)

const isLoggedIn = computed(() => auth.isLoggedIn.value)
const replyingToId = computed(() => replyTarget.value?.id ?? null)
const editingId = computed(() => editingTarget.value?.id ?? null)

const refreshBoard = async () => {
	try {
		await auth.ensureReady()
		const response = await $fetch<MessageBoardResponse>('/api/messages')
		items.value = response.items
		auth.user.value = response.currentUser
	} catch (error) {
		showError(error)
	}
}

const runCommentMutation = async (payload: {
	content: string
	parentId?: string
}) => {
	if (!isLoggedIn.value) {
		return
	}

	submitting.value = true

	try {
		const response = await $fetch<MessageBoardResponse>('/api/messages', {
			method: 'POST',
			body: payload,
		})
		items.value = response.items
		auth.user.value = response.currentUser
		replyTarget.value = null
		editingTarget.value = null
	} catch (error) {
		showError(error)
	} finally {
		submitting.value = false
	}
}

const submitRootComment = async (content: string) => {
	await runCommentMutation({ content })
}

const startReply = (item: MessageCommentItem) => {
	if (!isLoggedIn.value) {
		return
	}

	editingTarget.value = null
	replyTarget.value = item
}

const cancelReply = () => {
	replyTarget.value = null
}

const startEdit = (item: MessageCommentItem) => {
	if (!isLoggedIn.value || !item.canEdit) {
		return
	}

	replyTarget.value = null
	editingTarget.value = item
}

const cancelEdit = () => {
	editingTarget.value = null
}

const submitReply = async (commentId: string, content: string) => {
	await runCommentMutation({
		content,
		parentId: commentId,
	})
}

const submitEdit = async (commentId: string, content: string) => {
	if (!isLoggedIn.value) {
		return
	}

	editing.value = true

	try {
		const response = await $fetch<MessageBoardResponse>(
			`/api/messages/${commentId}`,
			{
				method: 'PATCH',
				body: {
					content,
				},
			},
		)
		items.value = response.items
		auth.user.value = response.currentUser
		editingTarget.value = null
	} catch (error) {
		showError(error)
	} finally {
		editing.value = false
	}
}

const likeComment = async (commentId: string) => {
	if (!isLoggedIn.value) {
		return
	}

	try {
		const response = await $fetch<MessageBoardResponse>(
			`/api/messages/${commentId}/like`,
			{
				method: 'POST',
			},
		)
		items.value = response.items
		auth.user.value = response.currentUser
	} catch (error) {
		showError(error)
	}
}

const deleteComment = async (commentId: string) => {
	if (!isLoggedIn.value) {
		return
	}

	deleting.value = true

	try {
		const response = await $fetch<MessageBoardResponse>(
			`/api/messages/${commentId}`,
			{
				method: 'DELETE',
			},
		)
		items.value = response.items
		auth.user.value = response.currentUser
		if (editingTarget.value?.id === commentId) {
			editingTarget.value = null
		}
		if (replyTarget.value?.id === commentId) {
			replyTarget.value = null
		}
	} catch (error) {
		showError(error)
	} finally {
		deleting.value = false
	}
}

watch(open, (value) => {
	if (value) {
		void refreshBoard()
	}
})
</script>
