<template>
	<Transition name="message-reply">
		<div v-if="open" class="message-reply-collapse -mx-1 grid">
			<div class="min-h-0 overflow-hidden">
				<div class="px-1 pt-2.5 pb-1">
					<MessageComposer
						:loading="loading"
						:disabled="disabled"
						:replying-to="replyingTo"
						:replying-to-floor="replyingToFloor"
						@cancel="$emit('cancel')"
						@submit="$emit('submit', $event)"
					/>
				</div>
			</div>
		</div>
	</Transition>
</template>

<script setup lang="ts">
interface MessageReplyComposerProps {
	open: boolean
	loading: boolean
	disabled?: boolean
	replyingTo: string
	replyingToFloor: number
}

defineProps<MessageReplyComposerProps>()
defineEmits<{
	submit: [content: string]
	cancel: []
}>()
</script>

<style scoped>
.message-reply-collapse {
	grid-template-rows: 1fr;
}

.message-reply-enter-active {
	transition:
		grid-template-rows 420ms cubic-bezier(0.22, 1, 0.36, 1),
		opacity 180ms ease-out;
}

.message-reply-leave-active {
	transition:
		grid-template-rows 300ms cubic-bezier(0.4, 0, 0.2, 1),
		opacity 220ms ease-in;
}

.message-reply-enter-from,
.message-reply-leave-to {
	grid-template-rows: 0fr;
	opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
	.message-reply-enter-active,
	.message-reply-leave-active {
		transition: none;
	}
}
</style>
