<template>
	<div class="space-y-3">
		<UTextarea
			class="w-full resize-none"
			v-model="draft"
			:rows="textareaRows"
			:disabled="disabled"
			:placeholder="placeholderText"
		/>
		<div
			:class="[
				'flex items-center gap-2 sm:gap-3',
				$slots.leading ? 'justify-between' : 'justify-end',
			]"
		>
			<div v-if="$slots.leading" class="min-w-0">
				<slot name="leading" />
			</div>
			<div class="flex items-center justify-end gap-2 sm:gap-3">
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
	replyingToFloor?: number | null
	disabled?: boolean
}>()

const emit = defineEmits<{
	submit: [content: string]
	cancel: []
}>()

const { t } = useI18n()
const draft = ref('')
const isMobile = ref(false)

const textareaRows = computed(() => (isMobile.value ? 6 : 5))
const placeholderText = computed(() => {
	if (!props.replyingTo) {
		return t('social.message.placeholder')
	}

	if (props.replyingToFloor !== null && props.replyingToFloor !== undefined) {
		return t('social.message.replyPlaceholderWithFloor', {
			login: props.replyingTo,
			floor: props.replyingToFloor,
		})
	}

	return t('social.message.replyPlaceholder', { login: props.replyingTo })
})

const syncViewportState = () => {
	if (!import.meta.client) {
		return
	}

	isMobile.value = window.innerWidth < 768
}

onMounted(() => {
	syncViewportState()
	window.addEventListener('resize', syncViewportState, { passive: true })
})

onBeforeUnmount(() => {
	if (!import.meta.client) {
		return
	}

	window.removeEventListener('resize', syncViewportState)
})

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
