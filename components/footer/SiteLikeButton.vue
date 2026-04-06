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
		</UTooltip>
	</div>
</template>

<script setup lang="ts">
import type { SiteLikeSummary } from '~/shared/types/social'

const { t } = useI18n()
const { showError } = useSocialFeedback()
const { ensureFingerprint } = useSiteFingerprint()
const emit = defineEmits<{
	(event: 'summary-change', summary: SiteLikeSummary): void
}>()

const loading = ref(false)
const ready = ref(false)
const summary = ref<SiteLikeSummary | null>(null)

const EMPTY_SITE_LIKE_SUMMARY: SiteLikeSummary = {
	totalCount: 0,
	hasLiked: false,
	githubLoginUserCount: 0,
}

const applySummary = (nextSummary: SiteLikeSummary | null) => {
	summary.value = nextSummary
	emit('summary-change', nextSummary ?? EMPTY_SITE_LIKE_SUMMARY)
}

const buttonLabel = computed(() => {
	const totalCount = summary.value?.totalCount ?? 0

	return t('social.siteLike.count', { count: totalCount })
})

const tooltipLabel = computed(() =>
	summary.value?.hasLiked
		? t('social.tooltip.siteLiked')
		: t('social.tooltip.siteLike'),
)

const loadSummary = async () => {
	try {
		const fingerprint = await ensureFingerprint()
		applySummary(
			await $fetch<SiteLikeSummary>('/api/site-like', {
				query: {
					fingerprint,
				},
			}),
		)
	} catch (error) {
		showError(error)
		applySummary(null)
	} finally {
		ready.value = true
	}
}

const handleLike = async () => {
	if (loading.value || summary.value?.hasLiked) {
		return
	}

	loading.value = true

	try {
		const fingerprint = await ensureFingerprint()
		applySummary(
			await $fetch<SiteLikeSummary>('/api/site-like', {
				method: 'POST',
				body: {
					fingerprint,
				},
			}),
		)
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
