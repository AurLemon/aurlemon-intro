<template>
	<div>
		<ContentHeader
			:bg-src="bgSrc"
			:title="title"
			:enable-opacity="enableOpacity"
			:use-clean-slot="useCleanSlot"
			:stats-text="statsText"
		>
			<slot />
		</ContentHeader>
		<ContentContainer
			:page="page"
			:fallback-locale="fallbackLocale"
			:doc="doc"
		/>
	</div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { getContentStats } from '~/utils/content-stats'

const props = withDefaults(
	defineProps<{
		page: string
		title: string
		bgSrc: string
		enableOpacity?: boolean
		useCleanSlot?: boolean
		fallbackLocale?: string
	}>(),
	{
		enableOpacity: false,
		useCleanSlot: false,
		fallbackLocale: 'zh-cn',
	},
)

const { t } = useI18n()
const { data: doc } = await useLocalizedContentDoc(
	() => props.page,
	() => props.fallbackLocale,
)

const statsText = computed(() => {
	if (!doc.value?.body) {
		return ''
	}

	const { totalCount, readingMinutes } = getContentStats(doc.value.body)

	return t('main.contentFooter.stats', {
		count: totalCount,
		minutes: readingMinutes,
	})
})
</script>
