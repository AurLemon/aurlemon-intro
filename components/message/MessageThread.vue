<template>
	<div :class="containerClass">
		<div class="flex items-start gap-3">
			<img
				:src="item.avatarUrl"
				:alt="item.githubLogin"
				class="h-10 w-10 rounded-full object-cover"
			/>
			<div class="min-w-0 flex-1 space-y-3">
				<div class="flex flex-wrap items-center gap-2">
					<span
						class="text-sm font-semibold text-slate-900 dark:text-slate-100"
					>
						{{ item.githubLogin }}
					</span>
					<span class="text-xs font-mono text-slate-500 dark:text-slate-400">
						#{{ item.floor }}
					</span>
					<span
						v-if="item.isPinned"
						class="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-500/20 dark:text-amber-200"
					>
						<UIcon name="i-lucide-pin" class="h-3 w-3" />
						{{ t('social.message.pinned') }}
					</span>
					<UButton
						size="xs"
						color="neutral"
						class="p-0 mr-2"
						variant="link"
						:to="item.profileUrl"
						target="_blank"
						aria-label="GitHub"
						title="GitHub"
					>
						<UIcon name="i-lucide-github" class="h-4 w-4" />
					</UButton>
					<span class="text-xs text-slate-500 dark:text-slate-400">
						{{ formatTime(item.createdAt) }}
					</span>
				</div>
				<div v-if="editingId !== item.id" class="space-y-1">
					<div
						v-if="item.isNestedReply && item.replyToGithubLogin"
						class="text-xs text-slate-500 dark:text-slate-400"
					>
						{{
							t('social.message.replyTo', { login: item.replyToGithubLogin })
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
				<div class="flex flex-wrap gap-2">
					<UTooltip
						v-if="item.likedByGithubLogins.length > 0"
						:delay-duration="50"
						:ui="{ content: 'z-[43120]' }"
					>
						<span class="inline-flex">
							<UButton
								size="xs"
								color="neutral"
								variant="ghost"
								:disabled="!canInteract || editingId === item.id"
								@click="handleLike(item.id)"
							>
								<UIcon name="i-lucide-heart" class="h-4 w-4" />
								<span class="leading-[normal]">
									{{ t('social.message.likeCount', { count: item.likeCount }) }}
								</span>
							</UButton>
						</span>
						<template #content>
							<div class="max-w-56 space-y-1.5 text-xs">
								<div class="space-y-0.5">
									<div
										v-for="login in item.likedByGithubLogins.slice(0, 3)"
										:key="login"
										class="font-mono"
									>
										@{{ login }}
									</div>
									<div
										v-if="item.likedByGithubLogins.length > 3"
										class="text-slate-400"
									>
										...
									</div>
								</div>
							</div>
						</template>
					</UTooltip>
					<UButton
						v-else
						size="xs"
						color="neutral"
						variant="ghost"
						:disabled="!canInteract || editingId === item.id"
						@click="handleLike(item.id)"
					>
						<UIcon name="i-lucide-heart" class="h-4 w-4" />
						<span class="leading-[normal]">
							{{ t('social.message.likeCount', { count: item.likeCount }) }}
						</span>
					</UButton>
					<UButton
						size="xs"
						color="neutral"
						variant="ghost"
						:disabled="!canInteract || editingId === item.id"
						@click="handleReply(item)"
					>
						{{ t('social.actions.reply') }}
					</UButton>
					<UButton
						v-if="item.canEdit"
						size="xs"
						color="neutral"
						variant="ghost"
						:disabled="!canInteract || editingLoading"
						@click="startEdit(item)"
					>
						{{ t('social.actions.edit') }}
					</UButton>
					<UButton
						v-if="item.canDelete"
						size="xs"
						color="error"
						variant="ghost"
						:disabled="!canInteract || editingLoading || deletingLoading"
						@click="handleDelete(item.id)"
					>
						{{ t('social.actions.delete') }}
					</UButton>
					<UButton
						v-if="item.canPin"
						size="xs"
						color="neutral"
						variant="ghost"
						:disabled="pinningLoading || editingLoading"
						@click="handleTogglePin(item)"
					>
						{{
							t(item.isPinned ? 'social.actions.unpin' : 'social.actions.pin')
						}}
					</UButton>
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
				<MessageComposer
					v-if="replyingToId === item.id"
					:loading="replyLoading"
					:disabled="!canInteract"
					:replying-to="item.githubLogin"
					@cancel="$emit('cancel-reply')"
					@submit="$emit('submit-reply', item.id, $event)"
				/>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
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
	depth: number
}>()

const { t } = useI18n()

const visibleReplies = computed(() =>
	props.depth >= 1 ? [] : props.item.replies,
)

const nextDepth = computed(() => Math.min(props.depth + 1, 1))
const containerClass = computed(() =>
	props.depth === 0
		? 'space-y-4 rounded-2xl border border-slate-200/70 p-4 dark:border-slate-800 mb-2'
		: 'space-y-4 py-1 mb-1',
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

const handleDelete = (id: string) => {
	if (!props.canInteract) {
		return
	}

	emit('delete', id)
}

const handleTogglePin = (item: MessageCommentItem) => {
	emit('toggle-pin', item.id, !item.isPinned)
}

watch(
	() => props.editingId,
	(editingId) => {
		if (editingId !== props.item.id) {
			editingDraft.value = ''
		}
	},
)
</script>
