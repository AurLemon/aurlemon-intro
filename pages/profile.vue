<template>
	<div>
		<ContentHeader :bg-src="profileCover" :title="$t('menu.profile')" />
		<ContentRenderer v-if="profileDoc" :value="profileDoc" />
	</div>
</template>

<script setup lang="ts">
import ContentHeader from '~/components/ContentHeader.vue'
import profileCover from '~/assets/resources/pages/profile_cover.webp'
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()

const { data: profileDoc } = await useAsyncData(
	'content-profile',
	async () => {
		const localizedPath = `/${locale.value.toLowerCase()}/profile`
		const localizedDoc = await queryCollection('content')
			.path(localizedPath)
			.first()

		if (localizedDoc) {
			return localizedDoc
		}

		if (locale.value !== 'zh-CN') {
			return await queryCollection('content').path('/zh-cn/profile').first()
		}

		return null
	},
	{ watch: [locale] },
)
</script>
