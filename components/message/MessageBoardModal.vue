<template>
	<UModal
		v-model:open="open"
		:title="t('social.message.title')"
		class="max-w-lg"
		:ui="{
			overlay: 'z-[43000]',
			content:
				'z-[43010] flex h-[calc(100dvh-2rem)] flex-col overflow-hidden sm:h-[calc(100dvh-4rem)]',
			body: 'min-h-0 flex h-full flex-1 overflow-hidden',
		}"
	>
		<template #actions>
			<div class="flex items-center gap-0.5">
				<UButton
					size="xs"
					color="neutral"
					variant="link"
					:class="[
						'leading-[normal]',
						sortOrder === 'latest' ? 'font-semibold' : 'opacity-80',
					]"
					@click="setSortOrder('latest')"
				>
					{{ t('social.actions.sortLatest') }}
				</UButton>
				<UButton
					size="xs"
					color="neutral"
					variant="link"
					:class="[
						'leading-[normal]',
						sortOrder === 'earliest' ? 'font-semibold' : 'opacity-80',
					]"
					@click="setSortOrder('earliest')"
				>
					{{ t('social.actions.sortEarliest') }}
				</UButton>
			</div>
		</template>

		<template #body>
			<div class="flex min-h-0 h-full flex-1 flex-col gap-4 overflow-hidden">
				<div
					ref="commentsScrollRef"
					class="min-h-0 flex-1 overflow-y-auto space-y-4 pr-1 scroll-smooth"
				>
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
							:pinning-loading="pinning"
							:deleting-loading="deleting"
							:can-interact="isLoggedIn"
							:depth="0"
							@like="likeComment"
							@reply="startReply"
							@cancel-reply="cancelReply"
							@submit-reply="submitReply"
							@start-edit="startEdit"
							@cancel-edit="cancelEdit"
							@submit-edit="submitEdit"
							@toggle-pin="togglePinComment"
							@delete="deleteComment"
						/>
					</div>
				</div>
				<div
					v-if="pagination.totalPages > 1"
					class="flex items-center justify-end gap-2"
				>
					<UButton
						size="xs"
						color="neutral"
						variant="ghost"
						:disabled="!pagination.hasPrev"
						@click="goPrevPage"
					>
						{{ t('social.actions.prevPage') }}
					</UButton>
					<span class="text-xs text-slate-500 dark:text-slate-400">
						{{
							t('social.message.pageInfo', {
								page: pagination.page,
								total: pagination.totalPages,
							})
						}}
					</span>
					<UButton
						size="xs"
						color="neutral"
						variant="ghost"
						:disabled="!pagination.hasNext"
						@click="goNextPage"
					>
						{{ t('social.actions.nextPage') }}
					</UButton>
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
							class="gap-1 shrink-0"
							variant="link"
							:aria-label="t('social.actions.openSiteLikeList')"
							@click="emit('open-site-like-list')"
						>
							<UIcon name="i-lucide-heart" class="h-4.5 w-4.5" />
							<span class="hidden leading-[normal] sm:inline">
								{{ t('social.actions.openSiteLikeList') }}
							</span>
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
	MessageBoardSortOrder,
} from '~/shared/types/social'

const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{
	'open-site-like-list': []
	'refresh-message-count': []
}>()

const { t } = useI18n()
const auth = useGithubAuth()
const { showError } = useSocialFeedback()

const items = ref<MessageCommentItem[]>([])
const currentPage = ref(1)
const pageSize = 6
const pagination = ref<MessageBoardResponse['pagination']>({
	page: 1,
	pageSize,
	totalPages: 1,
	totalRootCount: 0,
	totalCommentCount: 0,
	hasPrev: false,
	hasNext: false,
})
const submitting = ref(false)
const editing = ref(false)
const pinning = ref(false)
const deleting = ref(false)
const replyTarget = ref<MessageCommentItem | null>(null)
const editingTarget = ref<MessageCommentItem | null>(null)
const sortOrder = ref<MessageBoardSortOrder>('latest')

const isLoggedIn = computed(() => auth.isLoggedIn.value)
const replyingToId = computed(() => replyTarget.value?.id ?? null)
const editingId = computed(() => editingTarget.value?.id ?? null)
const commentsScrollRef = ref<HTMLElement | null>(null)
const boardQuery = computed(() => ({
	page: currentPage.value,
	pageSize,
	sort: sortOrder.value,
}))

const scrollCommentsToTop = async () => {
	if (!import.meta.client) {
		return
	}

	await nextTick()
	commentsScrollRef.value?.scrollTo({
		top: 0,
		behavior: 'smooth',
	})
}

const setSortOrder = (next: MessageBoardSortOrder) => {
	if (sortOrder.value === next) {
		return
	}

	sortOrder.value = next
	currentPage.value = 1
	void refreshBoard()
}

const refreshBoard = async () => {
	try {
		await auth.ensureReady()
		const response = await $fetch<MessageBoardResponse>('/api/messages', {
			query: boardQuery.value,
		})
		items.value = response.items
		pagination.value = response.pagination
		currentPage.value = response.pagination.page
		auth.user.value = response.currentUser
		void scrollCommentsToTop()
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
			query: boardQuery.value,
			body: payload,
		})
		items.value = response.items
		pagination.value = response.pagination
		currentPage.value = response.pagination.page
		auth.user.value = response.currentUser
		void scrollCommentsToTop()
		replyTarget.value = null
		editingTarget.value = null
		emit('refresh-message-count')
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
				query: boardQuery.value,
				body: {
					content,
				},
			},
		)
		items.value = response.items
		pagination.value = response.pagination
		currentPage.value = response.pagination.page
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
				query: boardQuery.value,
			},
		)
		items.value = response.items
		pagination.value = response.pagination
		currentPage.value = response.pagination.page
		auth.user.value = response.currentUser
	} catch (error) {
		showError(error)
	}
}

const togglePinComment = async (commentId: string, pinned: boolean) => {
	if (!isLoggedIn.value || auth.user.value?.isAdmin !== true) {
		return
	}

	pinning.value = true

	try {
		const response = await $fetch<MessageBoardResponse>(
			`/api/messages/${commentId}/pin`,
			{
				method: 'PATCH',
				query: boardQuery.value,
				body: {
					pinned,
				},
			},
		)
		items.value = response.items
		pagination.value = response.pagination
		currentPage.value = response.pagination.page
		auth.user.value = response.currentUser
	} catch (error) {
		showError(error)
	} finally {
		pinning.value = false
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
				query: boardQuery.value,
			},
		)
		items.value = response.items
		pagination.value = response.pagination
		currentPage.value = response.pagination.page
		auth.user.value = response.currentUser
		void scrollCommentsToTop()
		if (editingTarget.value?.id === commentId) {
			editingTarget.value = null
		}
		if (replyTarget.value?.id === commentId) {
			replyTarget.value = null
		}
		emit('refresh-message-count')
	} catch (error) {
		showError(error)
	} finally {
		deleting.value = false
	}
}

const goPrevPage = () => {
	if (!pagination.value.hasPrev) {
		return
	}

	currentPage.value -= 1
	void refreshBoard()
}

const goNextPage = () => {
	if (!pagination.value.hasNext) {
		return
	}

	currentPage.value += 1
	void refreshBoard()
}

watch(open, async (value) => {
	if (!value) {
		return
	}

	await refreshBoard()
	emit('refresh-message-count')
})
</script>
