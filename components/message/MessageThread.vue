<template>
	<div
		:id="`message-comment-${item.id}`"
		:class="[
			containerClass,
			item.id === focusedCommentId
				? 'ring-2 ring-primary-400 ring-offset-2 dark:ring-offset-slate-950'
				: '',
		]"
	>
		<div class="flex items-start gap-3">
			<div class="relative h-10 w-10 flex-shrink-0">
				<SkeletonImage
					:src="item.avatarUrl"
					:alt="item.displayName"
					class="block h-10 w-10"
					image-class="block h-10 w-10 rounded-full object-cover"
					skeleton-class="rounded-full"
				/>
			</div>
			<div class="min-w-0 flex-1 space-y-2.5">
				<div class="flex flex-wrap items-center gap-x-2 gap-y-0.5">
					<span
						class="text-sm font-semibold text-slate-900 dark:text-slate-100"
					>
						{{ item.displayName }}
					</span>
					<span class="text-xs text-slate-500 dark:text-slate-400">
						@{{ item.username }}
					</span>
					<span
						v-if="item.isPinned"
						class="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-500/20 dark:text-amber-200"
					>
						<UIcon name="i-lucide-pin" class="h-3 w-3" />
						{{ t('social.message.pinned') }}
					</span>
					<UButton
						v-if="githubIdentity"
						size="xs"
						color="neutral"
						class="p-0"
						variant="link"
						:to="githubIdentity.profileUrl"
						target="_blank"
						aria-label="GitHub"
						title="GitHub"
					>
						<UIcon name="i-lucide-github" class="h-4 w-4" />
					</UButton>
					<UButton
						v-if="linuxDoIdentity"
						size="xs"
						color="neutral"
						class="p-0"
						variant="link"
						:to="linuxDoIdentity.profileUrl"
						target="_blank"
						aria-label="Linux DO"
						title="Linux DO"
					>
						<LinuxDoIcon class="h-4 w-4" />
					</UButton>
				</div>
				<div v-if="editingId !== item.id" class="space-y-2">
					<div
						v-if="item.isNestedReply && item.replyToUsername"
						class="text-xs text-slate-500 dark:text-slate-400"
					>
						{{
							t('social.message.replyTo', {
								login: item.replyToUsername,
								floor: item.replyToFloor,
							})
						}}
					</div>
					<p
						class="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200"
					>
						{{ item.content }}
					</p>
				</div>
				<div v-else class="space-y-3">
					<UTextarea v-model="editingDraft" :rows="3" class="w-full" />
					<div class="flex justify-end gap-2">
						<UButton
							size="xs"
							color="neutral"
							variant="ghost"
							@click="$emit('cancel-edit')"
						>
							{{ t('social.actions.cancelEdit') }}
						</UButton>
						<UButton
							size="xs"
							color="primary"
							:loading="editingLoading"
							@click="saveEdit(item.id)"
						>
							{{ t('social.actions.saveEdit') }}
						</UButton>
					</div>
				</div>
				<div
					ref="actionRowRef"
					class="flex min-w-0 items-center gap-0 sm:gap-0.5"
				>
					<span
						class="mr-1 shrink-0 text-xs text-slate-500 dark:text-slate-400 leading-[normal]"
					>
						{{ formatTime(item.createdAt) }}
					</span>
					<UTooltip
						v-if="item.likedByUsernames.length > 0"
						:delay-duration="50"
						:ui="{ content: 'z-[43120]' }"
					>
						<span class="inline-flex">
							<UButton
								size="xs"
								color="neutral"
								variant="ghost"
								class="px-1 sm:px-1.5"
								@click="handleLike(item.id)"
							>
								<UIcon name="i-lucide-heart" class="h-4 w-4" />
								<span class="leading-[normal]">
									{{ t('social.message.likeCount', { count: item.likeCount }) }}
								</span>
							</UButton>
						</span>
						<template #content>
							<div class="max-w-56 text-xs leading-tight">
								<div class="flex flex-wrap gap-x-1.5 gap-y-0.5">
									<span
										v-for="login in item.likedByUsernames.slice(0, 3)"
										:key="login"
									>
										@{{ login }}
									</span>
									<span
										v-if="item.likedByUsernames.length > 3"
										class="text-slate-400"
									>
										...
									</span>
								</div>
							</div>
						</template>
					</UTooltip>
					<UButton
						v-else
						size="xs"
						color="neutral"
						variant="ghost"
						class="px-1 sm:px-1.5"
						@click="handleLike(item.id)"
					>
						<UIcon name="i-lucide-heart" class="h-4 w-4" />
						<span class="leading-[normal]">
							{{ t('social.message.likeCount', { count: item.likeCount }) }}
						</span>
					</UButton>
					<UButton
						v-if="shouldShowInlineReply"
						size="xs"
						color="neutral"
						variant="ghost"
						class="shrink-0 whitespace-nowrap leading-[normal]"
						@click="handleReply(item)"
					>
						<span class="whitespace-nowrap leading-[normal]">{{
							t('social.actions.reply')
						}}</span>
					</UButton>
					<div class="ml-auto shrink-0">
						<UPopover
							:content="{ align: 'end', side: 'bottom' }"
							:ui="{ content: 'z-[43110]' }"
						>
							<UButton
								type="button"
								size="xs"
								color="neutral"
								variant="ghost"
								class="px-1 sm:px-1.5"
								:aria-label="t('social.actions.moreCommentActions')"
							>
								<UIcon name="i-lucide-ellipsis" class="h-4 w-4" />
							</UButton>

							<template #content="{ close }">
								<div class="flex min-w-36 flex-col gap-1 p-2">
									<div
										class="px-3 py-1.5 text-xs text-slate-500 dark:text-slate-400"
									>
										#{{ item.floor }}
									</div>
									<UButton
										v-if="!shouldShowInlineReply"
										type="button"
										size="xs"
										color="neutral"
										variant="ghost"
										class="w-full justify-start gap-2 rounded-lg px-3 py-2"
										@click="handleMenuReply(item, close)"
									>
										<UIcon name="i-lucide-reply" class="h-4 w-4" />
										{{ t('social.actions.reply') }}
									</UButton>
									<UButton
										v-if="item.canEdit"
										type="button"
										size="xs"
										color="neutral"
										variant="ghost"
										class="w-full justify-start gap-2 rounded-lg px-3 py-2"
										:disabled="!canInteract || editingLoading"
										@click="handleMenuEdit(item, close)"
									>
										<UIcon name="i-lucide-pencil" class="h-4 w-4" />
										{{ t('social.actions.edit') }}
									</UButton>
									<UButton
										v-if="item.canDelete"
										type="button"
										size="xs"
										color="error"
										variant="ghost"
										class="w-full justify-start gap-2 rounded-lg px-3 py-2"
										:disabled="
											!canInteract || editingLoading || deletingLoading
										"
										@click="handleMenuDelete(item.id, close)"
									>
										<UIcon name="i-lucide-trash-2" class="h-4 w-4" />
										{{ t('social.actions.delete') }}
									</UButton>
									<UButton
										v-if="item.canPin"
										type="button"
										size="xs"
										color="neutral"
										variant="ghost"
										class="w-full justify-start gap-2 rounded-lg px-3 py-2"
										:disabled="pinningLoading || editingLoading"
										@click="handleMenuTogglePin(item, close)"
									>
										<UIcon name="i-lucide-pin" class="h-4 w-4" />
										{{
											t(
												item.isPinned
													? 'social.actions.unpin'
													: 'social.actions.pin',
											)
										}}
									</UButton>
								</div>
							</template>
						</UPopover>
					</div>
				</div>
				<div
					v-if="replyingToId === item.id && depth > 0"
					ref="replyComposerRef"
				>
					<MessageComposer
						:loading="replyLoading"
						:disabled="!canInteract"
						:replying-to="item.username"
						:replying-to-floor="item.floor"
						@cancel="$emit('cancel-reply')"
						@submit="$emit('submit-reply', item.id, $event)"
					/>
				</div>
				<div
					v-if="showReplyArea"
					:style="replyAreaStyle"
					class="overflow-hidden transition-[height,opacity] duration-300 ease-out"
				>
					<div ref="replyAreaRef" class="space-y-3 pt-1">
						<div
							v-if="replyingToId === item.id && depth === 0"
							ref="replyComposerRef"
						>
							<MessageComposer
								:loading="replyLoading"
								:disabled="!canInteract"
								:replying-to="item.username"
								:replying-to-floor="item.floor"
								@cancel="$emit('cancel-reply')"
								@submit="$emit('submit-reply', item.id, $event)"
							/>
						</div>
						<div v-if="visibleReplies.length" class="space-y-3">
							<MessageThread
								v-for="reply in visibleReplies"
								:key="reply.id"
								:item="reply"
								:replying-to-id="replyingToId"
								:reply-loading="replyLoading"
								:editing-id="editingId"
								:editing-loading="editingLoading"
								:pinning-loading="pinningLoading"
								:deleting-loading="deletingLoading"
								:can-interact="canInteract"
								:focused-comment-id="focusedCommentId"
								:depth="nextDepth"
								@like="$emit('like', $event)"
								@reply="$emit('reply', $event)"
								@cancel-reply="$emit('cancel-reply')"
								@submit-reply="forwardReply"
								@start-edit="$emit('start-edit', $event)"
								@cancel-edit="$emit('cancel-edit')"
								@submit-edit="forwardEdit"
								@toggle-pin="forwardTogglePin"
								@delete="$emit('delete', $event)"
							/>
						</div>
						<div
							v-if="showReplyPager"
							class="flex flex-wrap items-center gap-2 pt-1"
						>
							<UButton
								v-if="!replyExpanded"
								size="xs"
								color="neutral"
								variant="ghost"
								@click="expandReplies"
							>
								{{
									t('social.actions.expandReplies', { count: hiddenReplyCount })
								}}
							</UButton>
							<template v-else>
								<div
									v-if="replyTotalPages > 1"
									class="flex flex-wrap items-center gap-2"
								>
									<UButton
										size="xs"
										color="neutral"
										variant="ghost"
										:disabled="replyPage <= 1"
										@click="goPrevReplyPage"
									>
										{{ t('social.actions.prevPage') }}
									</UButton>
									<span
										class="text-xs text-slate-500 dark:text-slate-400 tabular-nums"
									>
										{{
											t('social.message.replyPageInfo', {
												page: replyPage,
												total: replyTotalPages,
											})
										}}
									</span>
									<UButton
										size="xs"
										color="neutral"
										variant="ghost"
										:disabled="replyPage >= replyTotalPages"
										@click="goNextReplyPage"
									>
										{{ t('social.actions.nextPage') }}
									</UButton>
								</div>
								<UButton
									size="xs"
									color="neutral"
									variant="ghost"
									class="ml-auto"
									@click="collapseReplies"
								>
									{{ t('social.actions.collapseReplies') }}
								</UButton>
							</template>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import LinuxDoIcon from '~/assets/icons/linux-do.svg'
import type { MessageCommentItem } from '~/shared/types/social'

const props = defineProps<{
	item: MessageCommentItem
	replyingToId: string | null
	replyLoading: boolean
	editingId: string | null
	editingLoading: boolean
	pinningLoading: boolean
	deletingLoading: boolean
	canInteract: boolean
	focusedCommentId: string | null
	depth: number
}>()

const { t } = useI18n({ useScope: 'global' })
const githubIdentity = computed(() =>
	props.item.identities.find((identity) => identity.provider === 'GITHUB'),
)
const linuxDoIdentity = computed(() =>
	props.item.identities.find((identity) => identity.provider === 'LINUX_DO'),
)

const REPLY_PAGE_SIZE = 3
const REPLY_PREVIEW_COUNT = 1
const NESTED_REPLY_INLINE_MIN_WIDTH = 300
const replyExpanded = ref(false)
const replyPage = ref(1)
const replyAreaRef = ref<HTMLElement | null>(null)
const replyComposerRef = ref<HTMLElement | null>(null)
const replyAreaHeight = ref('0px')
const actionRowRef = ref<HTMLElement | null>(null)
const actionRowWidth = ref(0)

const replyTotalPages = computed(() =>
	Math.max(1, Math.ceil(props.item.replies.length / REPLY_PAGE_SIZE)),
)

const hiddenReplyCount = computed(() =>
	Math.max(0, props.item.replies.length - REPLY_PREVIEW_COUNT),
)

const showReplyArea = computed(
	() =>
		props.depth === 0 &&
		(props.item.replies.length > 0 ||
			replyExpanded.value ||
			props.item.id === props.replyingToId),
)

const visibleReplies = computed(() => {
	if (props.depth >= 1) {
		return []
	}

	if (!replyExpanded.value) {
		return props.item.replies.slice(0, REPLY_PREVIEW_COUNT)
	}

	const start = (replyPage.value - 1) * REPLY_PAGE_SIZE
	return props.item.replies.slice(start, start + REPLY_PAGE_SIZE)
})

const showReplyPager = computed(
	() => props.depth === 0 && props.item.replies.length > REPLY_PREVIEW_COUNT,
)

const revealFocusedReply = () => {
	if (!props.focusedCommentId || props.depth !== 0) return
	const replyIndex = props.item.replies.findIndex(
		(reply) => reply.id === props.focusedCommentId,
	)
	if (replyIndex < 0) return
	replyExpanded.value = true
	replyPage.value = Math.floor(replyIndex / REPLY_PAGE_SIZE) + 1
}

const updateReplyAreaHeight = async () => {
	if (!import.meta.client || !replyAreaRef.value) {
		return
	}

	await nextTick()
	replyAreaHeight.value = `${replyAreaRef.value.scrollHeight}px`
}

const replyAreaStyle = computed(() => ({
	height: replyAreaHeight.value,
}))

const nextDepth = computed(() => Math.min(props.depth + 1, 1))
const shouldShowInlineReply = computed(
	() =>
		props.depth === 0 || actionRowWidth.value >= NESTED_REPLY_INLINE_MIN_WIDTH,
)
const containerClass = computed(() =>
	props.depth === 0 ? 'space-y-3 py-3 first:pt-0 last:pb-0' : 'space-y-3 py-0',
)

const formatTime = (value: string) => dayjs(value).format('YYYY-MM-DD HH:mm')

const emit = defineEmits<{
	like: [id: string]
	reply: [item: MessageCommentItem]
	'cancel-reply': []
	'submit-reply': [id: string, content: string]
	'start-edit': [item: MessageCommentItem]
	'cancel-edit': []
	'submit-edit': [id: string, content: string]
	'toggle-pin': [id: string, pinned: boolean]
	delete: [id: string]
}>()

const forwardReply = (id: string, content: string) => {
	emit('submit-reply', id, content)
}

const forwardEdit = (id: string, content: string) => {
	emit('submit-edit', id, content)
}

const forwardTogglePin = (id: string, pinned: boolean) => {
	emit('toggle-pin', id, pinned)
}

const editingDraft = ref('')

const startEdit = (item: MessageCommentItem) => {
	editingDraft.value = item.content
	emit('start-edit', item)
}

const saveEdit = (id: string) => {
	const content = editingDraft.value.trim()

	if (!content) {
		return
	}

	emit('submit-edit', id, content)
}

const handleLike = (id: string) => {
	if (!props.canInteract) {
		return
	}

	emit('like', id)
}

const handleReply = (item: MessageCommentItem) => {
	if (!props.canInteract) {
		return
	}

	emit('reply', item)
}

const handleMenuReply = (item: MessageCommentItem, close: () => void) => {
	close()
	handleReply(item)
}

const handleDelete = (id: string) => {
	if (!props.canInteract) {
		return
	}

	emit('delete', id)
}

const handleTogglePin = (item: MessageCommentItem) => {
	emit('toggle-pin', item.id, !item.isPinned)
}

const handleMenuEdit = (item: MessageCommentItem, close: () => void) => {
	close()
	startEdit(item)
}

const handleMenuDelete = (id: string, close: () => void) => {
	close()
	handleDelete(id)
}

const handleMenuTogglePin = (item: MessageCommentItem, close: () => void) => {
	close()
	handleTogglePin(item)
}

const scrollReplyComposerIntoView = async () => {
	if (!import.meta.client || !replyComposerRef.value) {
		return
	}

	await nextTick()
	replyComposerRef.value.scrollIntoView({
		behavior: 'smooth',
		block: 'center',
	})
}

const expandReplies = () => {
	replyExpanded.value = true
	replyPage.value = 1
}

const collapseReplies = () => {
	replyExpanded.value = false
	replyPage.value = 1
}

const goPrevReplyPage = () => {
	replyPage.value = Math.max(1, replyPage.value - 1)
}

const goNextReplyPage = () => {
	replyPage.value = Math.min(replyTotalPages.value, replyPage.value + 1)
}

watch(
	() => props.editingId,
	(editingId) => {
		if (editingId !== props.item.id) {
			editingDraft.value = ''
		}
	},
)

let replyAreaObserver: ResizeObserver | null = null
let actionRowObserver: ResizeObserver | null = null

watch(
	() => props.focusedCommentId,
	() => {
		revealFocusedReply()
		void updateReplyAreaHeight()
	},
	{ immediate: true, flush: 'post' },
)

watch(
	() => props.item.replies.length,
	() => {
		replyPage.value = Math.min(replyPage.value, replyTotalPages.value)
		replyPage.value = Math.max(1, replyPage.value)
		void updateReplyAreaHeight()
	},
)

watch(
	() => [
		replyExpanded.value,
		replyPage.value,
		props.replyingToId,
		props.item.replies.length,
	],
	() => {
		void updateReplyAreaHeight()
	},
	{ flush: 'post' },
)

watch(
	() => props.replyingToId === props.item.id,
	(isReplying) => {
		if (!isReplying) {
			return
		}

		void scrollReplyComposerIntoView()
	},
	{ flush: 'post' },
)

watch(
	() => replyAreaRef.value,
	(element) => {
		replyAreaObserver?.disconnect()
		replyAreaObserver = null

		if (!import.meta.client || !element) {
			return
		}

		replyAreaObserver = new ResizeObserver(() => {
			void updateReplyAreaHeight()
		})

		replyAreaObserver.observe(element)
		void updateReplyAreaHeight()
	},
	{ flush: 'post', immediate: true },
)

watch(
	() => actionRowRef.value,
	(element) => {
		actionRowObserver?.disconnect()
		actionRowObserver = null

		if (!import.meta.client || !element) {
			return
		}

		const syncActionRowWidth = () => {
			actionRowWidth.value = element.clientWidth
		}

		actionRowObserver = new ResizeObserver(syncActionRowWidth)
		actionRowObserver.observe(element)
		syncActionRowWidth()
	},
	{ flush: 'post', immediate: true },
)

onBeforeUnmount(() => {
	replyAreaObserver?.disconnect()
	replyAreaObserver = null
	actionRowObserver?.disconnect()
	actionRowObserver = null
})
</script>
