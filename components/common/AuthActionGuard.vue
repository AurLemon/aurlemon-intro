<template>
	<UAlert
		color="primary"
		variant="soft"
		:title="title"
		:description="description"
	>
		<template #actions>
			<UButton size="sm" color="primary" @click="login()">
				{{ t('social.actions.loginWithGithub') }}
			</UButton>
		</template>
	</UAlert>
</template>

<script setup lang="ts">
const props = defineProps<{
	title: string
	description: string
}>()

const { t } = useI18n()
const { login } = useGithubAuth()

const title = computed(() => props.title)
const description = computed(() => props.description)
</script>
