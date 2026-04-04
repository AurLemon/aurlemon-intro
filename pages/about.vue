<template>
	<div>
		<ContentHeader :bg-src="aboutCover" :title="$t('menu.about')" />
		<ContentRenderer v-if="aboutDoc" :value="aboutDoc" />
	</div>
</template>

<script setup lang="ts">
import ContentHeader from '~/components/ContentHeader.vue'
import aboutCover from '~/assets/resources/pages/about_cover.webp'
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()

const { data: aboutDoc } = await useAsyncData(
	'content-about',
	async () => {
		const localizedPath = `/${locale.value.toLowerCase()}/about`
		const localizedDoc = await queryCollection('content')
			.path(localizedPath)
			.first()

		if (localizedDoc) {
			return localizedDoc
		}

		if (locale.value !== 'zh-CN') {
			return await queryCollection('content').path('/zh-cn/about').first()
		}

		return null
	},
	{ watch: [locale] },
)
</script>
