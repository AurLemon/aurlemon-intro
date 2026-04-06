<template>
	<div
		class="transition-all duration-300 ease-out"
		:class="
			ready
				? 'opacity-100 translate-y-0 scale-100'
				: 'opacity-0 translate-y-1 scale-95 pointer-events-none'
		"
	>
		<UTooltip :text="tooltipLabel" :delay-duration="50">
			<UButton
				color="neutral"
				variant="link"
				class="rounded-full"
				:aria-label="t('social.actions.openGithubLoginUserList')"
				@click="emit('open-list')"
			>
				<UIcon name="i-lucide-github" class="h-5 w-5" />
				<span class="block text-base">{{ buttonLabel }}</span>
			</UButton>
		</UTooltip>
	</div>
</template>

<script setup lang="ts">
interface Props {
	count?: number
	ready?: boolean
}

const props = withDefaults(defineProps<Props>(), {
	count: 0,
	ready: false,
})
const emit = defineEmits<{
	(event: 'open-list'): void
}>()

const { t } = useI18n()

const buttonLabel = computed(() =>
	t('social.githubLogin.count', { count: props.count }),
)

const tooltipLabel = computed(() => t('social.tooltip.githubLoginUserCount'))
</script>
