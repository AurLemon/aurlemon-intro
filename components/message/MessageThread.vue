<template>
	<div
		class="space-y-4 rounded-2xl border border-slate-200/70 p-4 dark:border-slate-800"
	>
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
				<p
					v-if="editingId !== item.id"
					class="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200"
				>
					{{ item.content }}
				</p>
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
					<UButton
						size="xs"
						color="neutral"
						variant="ghost"
						:disabled="item.hasLiked || !canInteract || editingId === item.id"
						@click="handleLike(item.id)"
					>
						<UIcon name="i-lucide-heart" class="h-4 w-4" />
						<span>
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
						v-if="item.canEdit"
						size="xs"
						color="error"
						variant="ghost"
						:disabled="!canInteract || editingLoading || deletingLoading"
						@click="handleDelete(item.id)"
					>
						{{ t('social.actions.delete') }}
					</UButton>
				</div>
				<div v-if="item.replies.length" class="space-y-3">
					<MessageThread
						v-for="reply in item.replies"
						:key="reply.id"
						:item="reply"
						:replying-to-id="replyingToId"
						:reply-loading="replyLoading"
						:editing-id="editingId"
						:editing-loading="editingLoading"
						:deleting-loading="deletingLoading"
						:can-interact="canInteract"
						@like="$emit('like', $event)"
						@reply="$emit('reply', $event)"
						@cancel-reply="$emit('cancel-reply')"
						@submit-reply="forwardReply"
						@start-edit="$emit('start-edit', $event)"
						@cancel-edit="$emit('cancel-edit')"
						@submit-edit="forwardEdit"
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
	deletingLoading: boolean
	canInteract: boolean
}>()

const { t } = useI18n()

const formatTime = (value: string) => dayjs(value).format('YYYY-MM-DD HH:mm')

const emit = defineEmits<{
	like: [id: string]
	reply: [item: MessageCommentItem]
	'cancel-reply': []
	'submit-reply': [id: string, content: string]
	'start-edit': [item: MessageCommentItem]
	'cancel-edit': []
	'submit-edit': [id: string, content: string]
	delete: [id: string]
}>()

const forwardReply = (id: string, content: string) => {
	emit('submit-reply', id, content)
}

const forwardEdit = (id: string, content: string) => {
	emit('submit-edit', id, content)
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

watch(
	() => props.editingId,
	(editingId) => {
		if (editingId !== props.item.id) {
			editingDraft.value = ''
		}
	},
)
</script>
