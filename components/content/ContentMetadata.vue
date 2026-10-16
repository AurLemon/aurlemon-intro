<template>
	<p
		v-if="doc.body"
		class="text-sm leading-6 text-slate-500 dark:text-slate-400"
	>
		{{
			$t('main.contentMetadata.stats', {
				count: contentStats.totalCount,
				minutes: contentStats.readingMinutes,
			})
		}}
	</p>
</template>

<script setup lang="ts">
import {
	getContentStats,
	type ContentDocumentMeta,
} from '~/utils/content-stats'

interface Props {
	doc: ContentDocumentMeta
}

const props = defineProps<Props>()
const contentStats = computed(() => getContentStats(props.doc.body))
</script>
