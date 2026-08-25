<template>
	<UModal
		v-model:open="open"
		:title="t('social.message.title')"
		class="max-w-lg"
		:ui="{
			overlay: 'z-[43000]',
			content:
				'z-[43010] flex h-[calc(100dvh-2rem)] flex-col overflow-hidden sm:h-[calc(100dvh-4rem)]',
			body: 'min-h-0 flex h-full flex-1 overflow-hidden p-0!',
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
			<div class="relative min-h-0 h-full flex-1 overflow-hidden">
				<div
					ref="commentsScrollRef"
					class="message-board-scroll absolute inset-0 overflow-y-auto scroll-smooth"
					@scroll.passive="syncScrollCues"
				>
					<div class="px-4 pt-4 sm:px-6 sm:pt-6" :style="commentsContentStyle">
						<UAlert
							v-if="!items.length"
							color="neutral"
							variant="soft"
							:title="t('social.message.emptyTitle')"
							:description="t('social.message.emptyDesc')"
						/>
						<div v-else>
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
								:focused-comment-id="focusedCommentId"
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
						<div
							v-if="pagination.totalPages > 1"
							class="mt-3 flex items-center justify-end gap-2"
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
					</div>
				</div>
				<div
					v-show="canScrollUp"
					class="pointer-events-none absolute inset-x-0 top-0 z-10 h-8 bg-default/85 backdrop-blur-sm mask-[linear-gradient(to_bottom,black_0%,rgba(0,0,0,0.55)_45%,transparent_100%)]"
				/>
				<div
					ref="composerAreaRef"
					class="absolute inset-x-0 -bottom-px z-10 bg-default px-4 pt-2 pb-4 sm:px-6 sm:pb-6"
				>
					<div
						class="pointer-events-none absolute inset-x-0 -top-12 h-[calc(3rem+2px)] bg-default/90 backdrop-blur-md mask-[linear-gradient(to_bottom,transparent_0%,rgba(0,0,0,0.18)_20%,rgba(0,0,0,0.58)_60%,black_100%)]"
					/>
					<Transition name="message-scroll-cue">
						<UIcon
							v-if="canScrollDown"
							name="i-lucide-chevrons-down"
							class="message-scroll-cue pointer-events-none absolute left-1/2 -top-8 h-4 w-4 text-muted"
							aria-hidden="true"
						/>
					</Transition>
					<div class="relative">
						<MessageComposer
							:loading="submitting"
							:disabled="!isLoggedIn"
							@submit="submitRootComment"
						>
							<template #leading>
								<AccountStatusBar compact />
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
				</div>
			</div>
		</template>
	</UModal>
</template>

<script setup lang="ts">
import AccountStatusBar from '~/components/common/AccountStatusBar.vue'
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

const { t } = useI18n({ useScope: 'global' })
const auth = useAuth()
const route = useRoute()
const router = useRouter()
const { showError } = useSocialFeedback()

const items = ref<MessageCommentItem[]>([])
const currentPage = ref(1)
const pageSize = 10
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
const composerAreaRef = ref<HTMLElement | null>(null)
const composerAreaHeight = ref(0)
const canScrollUp = ref(false)
const canScrollDown = ref(false)
const focusedCommentId = ref<string | null>(null)
const commentsContentStyle = computed(() => ({
	paddingBottom: composerAreaHeight.value
		? `${composerAreaHeight.value + 20}px`
		: '0px',
}))
const boardQuery = computed(() => ({
	page: currentPage.value,
	pageSize,
	sort: sortOrder.value,
	...(focusedCommentId.value ? { comment: focusedCommentId.value } : {}),
}))

const scrollCommentsToTop = async () => {
	if (!import.meta.client) {
		return
	}

	await nextTick()
	const scrollArea = commentsScrollRef.value
	if (!scrollArea || scrollArea.scrollTop <= 2) {
		return
	}

	scrollArea.scrollTo({
		top: 0,
		behavior: 'smooth',
	})

	await new Promise<void>((resolve) => {
		const waitForScrollEnd = () => {
			if (scrollArea.scrollTop <= 2) {
				resolve()
				return
			}

			requestAnimationFrame(waitForScrollEnd)
		}

		requestAnimationFrame(waitForScrollEnd)
	})
}

const revealFocusedComment = async () => {
	if (!import.meta.client || !focusedCommentId.value) return
	await nextTick()
	document
		.getElementById(`message-comment-${focusedCommentId.value}`)
		?.scrollIntoView({ behavior: 'smooth', block: 'center' })
	const query = { ...route.query }
	delete query.comment
	await router.replace({ query })
	window.setTimeout(() => {
		focusedCommentId.value = null
	}, 4000)
}

const syncScrollCues = () => {
	const scrollArea = commentsScrollRef.value
	if (!scrollArea) {
		canScrollUp.value = false
		canScrollDown.value = false
		return
	}

	const maxScrollTop = Math.max(
		0,
		scrollArea.scrollHeight - scrollArea.clientHeight,
	)
	canScrollUp.value = scrollArea.scrollTop > 2
	canScrollDown.value =
		maxScrollTop > 2 && scrollArea.scrollTop < maxScrollTop - 2
}

let composerAreaObserver: ResizeObserver | null = null
let scrollAreaObserver: ResizeObserver | null = null

const observeModalLayout = async () => {
	composerAreaObserver?.disconnect()
	composerAreaObserver = null
	scrollAreaObserver?.disconnect()
	scrollAreaObserver = null

	if (!open.value || !import.meta.client) {
		canScrollUp.value = false
		canScrollDown.value = false
		return
	}

	await nextTick()
	const composerArea = composerAreaRef.value
	const scrollArea = commentsScrollRef.value
	if (!composerArea || !scrollArea) {
		return
	}

	const syncComposerAreaHeight = () => {
		composerAreaHeight.value = composerArea.offsetHeight
		void nextTick(syncScrollCues)
	}

	composerAreaObserver = new ResizeObserver(syncComposerAreaHeight)
	composerAreaObserver.observe(composerArea)
	scrollAreaObserver = new ResizeObserver(syncScrollCues)
	scrollAreaObserver.observe(scrollArea)
	if (scrollArea.firstElementChild instanceof HTMLElement) {
		scrollAreaObserver.observe(scrollArea.firstElementChild)
	}
	syncComposerAreaHeight()
	syncScrollCues()
}

watch(open, () => void observeModalLayout(), {
	immediate: true,
	flush: 'post',
})

onBeforeUnmount(() => {
	composerAreaObserver?.disconnect()
	composerAreaObserver = null
	scrollAreaObserver?.disconnect()
	scrollAreaObserver = null
})

const setSortOrder = (next: MessageBoardSortOrder) => {
	if (sortOrder.value === next) {
		return
	}

	sortOrder.value = next
	currentPage.value = 1
	void refreshBoard({ scrollToTop: true })
}

const refreshBoard = async ({ scrollToTop = false } = {}) => {
	try {
		await auth.ensureReady()
		const [response] = await Promise.all([
			$fetch<MessageBoardResponse>('/api/messages', {
				query: boardQuery.value,
			}),
			scrollToTop ? scrollCommentsToTop() : Promise.resolve(),
		])
		items.value = response.items
		pagination.value = response.pagination
		currentPage.value = response.pagination.page
		auth.user.value = response.currentUser
		if (focusedCommentId.value) {
			void revealFocusedComment()
		} else if (!scrollToTop) {
			void scrollCommentsToTop()
		}
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
	void refreshBoard({ scrollToTop: true })
}

const goNextPage = () => {
	if (!pagination.value.hasNext) {
		return
	}

	currentPage.value += 1
	void refreshBoard({ scrollToTop: true })
}

watch(open, async (value) => {
	if (!value) {
		return
	}

	focusedCommentId.value =
		typeof route.query.comment === 'string' ? route.query.comment : null
	await refreshBoard()
	emit('refresh-message-count')
})
</script>

<style scoped>
.message-board-scroll {
	-ms-overflow-style: none;
	scrollbar-width: none;
}

.message-board-scroll::-webkit-scrollbar {
	display: none;
	width: 0;
	height: 0;
}

.message-scroll-cue {
	transform: translateX(-50%);
}

.message-scroll-cue-enter-active,
.message-scroll-cue-leave-active {
	transition:
		opacity 180ms ease,
		transform 180ms ease;
}

.message-scroll-cue-enter-from,
.message-scroll-cue-leave-to {
	opacity: 0;
	transform: translate(-50%, 4px);
}
</style>
