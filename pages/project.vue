<template>
	<div>
		<ContentHeader :bg-src="projectCover" :title="$t('menu.project')" />
		<ContentRenderer v-if="projectDoc" :value="projectDoc" />
	</div>
</template>

<script setup lang="ts">
import ContentHeader from '~/components/ContentHeader.vue'
import projectCover from '~/assets/resources/pages/project_cover.webp'
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()

const { data: projectDoc } = await useAsyncData(
	'content-project',
	async () => {
		const localizedPath = `/${locale.value.toLowerCase()}/project`
		const localizedDoc = await queryCollection('content')
			.path(localizedPath)
			.first()

		if (localizedDoc) {
			return localizedDoc
		}

		if (locale.value !== 'zh-CN') {
			return await queryCollection('content').path('/zh-cn/project').first()
		}

		return null
	},
	{ watch: [locale] },
)
</script>
