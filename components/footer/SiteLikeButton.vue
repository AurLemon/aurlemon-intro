<template>
	<UButton
		:loading="loading"
		:disabled="summary?.hasLiked"
		color="error"
		variant="link"
		class="rounded-full"
		@click="handleLike"
	>
		<UIcon name="i-lucide-heart" class="h-5 w-5" />
		<span class="block text-base">{{ buttonLabel }}</span>
	</UButton>
</template>

<script setup lang="ts">
import type { SiteLikeSummary } from '~/shared/types/social'

const { t } = useI18n()
const { showError } = useSocialFeedback()
const { ensureFingerprint } = useSiteFingerprint()

const loading = ref(false)
const summary = ref<SiteLikeSummary | null>(null)

const buttonLabel = computed(() => {
	const totalCount = summary.value?.totalCount ?? 0

	return t('social.siteLike.count', { count: totalCount })
})

const loadSummary = async () => {
	try {
		const fingerprint = await ensureFingerprint()
		summary.value = await $fetch<SiteLikeSummary>('/api/site-like', {
			query: {
				fingerprint,
			},
		})
	} catch (error) {
		showError(error)
	}
}

const handleLike = async () => {
	if (loading.value || summary.value?.hasLiked) {
		return
	}

	loading.value = true

	try {
		const fingerprint = await ensureFingerprint()
		summary.value = await $fetch<SiteLikeSummary>('/api/site-like', {
			method: 'POST',
			body: {
				fingerprint,
			},
		})
	} catch (error) {
		showError(error)
	} finally {
		loading.value = false
	}
}

onMounted(() => {
	void loadSummary()
})
</script>
