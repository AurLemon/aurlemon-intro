<template>
	<div>
		<ContentHeader :bg-src="preferenceCover" :title="$t('menu.preference')" />
		<ContentRenderer v-if="preferenceDoc" :value="preferenceDoc" />
	</div>
</template>

<script setup lang="ts">
import ContentHeader from '~/components/ContentHeader.vue'
import preferenceCover from '~/assets/resources/pages/preference_cover.webp'
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()

const { data: preferenceDoc } = await useAsyncData(
	'content-preference',
	async () => {
		const localizedPath = `/${locale.value.toLowerCase()}/preference`
		const localizedDoc = await queryCollection('content')
			.path(localizedPath)
			.first()

		if (localizedDoc) {
			return localizedDoc
		}

		if (locale.value !== 'zh-CN') {
			return await queryCollection('content').path('/zh-cn/preference').first()
		}

		return null
	},
	{ watch: [locale] },
)
</script>
