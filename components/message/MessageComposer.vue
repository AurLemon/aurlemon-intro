<template>
	<div class="space-y-3">
		<UTextarea
			class="w-full"
			v-model="draft"
			:rows="replyingTo ? 3 : 4"
			:disabled="disabled"
			:placeholder="
				replyingTo
					? t('social.message.replyPlaceholder', { login: replyingTo })
					: t('social.message.placeholder')
			"
		/>
		<div
			:class="[
				'flex items-center gap-3',
				$slots.leading ? 'justify-between' : 'justify-end',
			]"
		>
			<div v-if="$slots.leading" class="min-w-0">
				<slot name="leading" />
			</div>
			<div class="flex items-center justify-end gap-3">
				<UButton
					v-if="replyingTo"
					color="neutral"
					variant="ghost"
					@click="$emit('cancel')"
				>
					{{ t('social.actions.cancelReply') }}
				</UButton>
				<slot name="before-submit" />
				<UButton
					:loading="loading"
					:disabled="disabled"
					color="primary"
					@click="submit"
				>
					{{
						t(
							replyingTo
								? 'social.actions.reply'
								: 'social.actions.sendComment',
						)
					}}
				</UButton>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
const props = defineProps<{
	loading: boolean
	replyingTo?: string | null
	disabled?: boolean
}>()

const emit = defineEmits<{
	submit: [content: string]
	cancel: []
}>()

const { t } = useI18n()
const draft = ref('')

const submit = () => {
	if (props.disabled) {
		return
	}

	const content = draft.value.trim()

	if (!content) {
		return
	}

	emit('submit', content)
	draft.value = ''
}

watch(
	() => props.replyingTo,
	() => {
		draft.value = ''
	},
)
</script>
