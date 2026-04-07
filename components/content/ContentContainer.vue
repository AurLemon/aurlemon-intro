<template>
	<div
		class="lg:px-6 py-6 pb-16 text-[18px] font-serif font-medium text-slate-900 dark:text-slate-100"
	>
		<ContentRenderer v-if="doc" :value="doc" />
	</div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const props = withDefaults(
	defineProps<{
		page: string
		fallbackLocale?: string
	}>(),
	{
		fallbackLocale: 'zh-cn',
	},
)

const { locale } = useI18n()

const normalizedPage = computed(() => props.page.replace(/^\/+|\/+$/g, ''))

const { data: doc } = await useAsyncData(
	() => `content-${normalizedPage.value}-${locale.value}`,
	async () => {
		const localizedPath = `/${locale.value.toLowerCase()}/${normalizedPage.value}`
		const localizedDoc = await queryCollection('content')
			.path(localizedPath)
			.first()

		if (localizedDoc) {
			return localizedDoc
		}

		if (locale.value.toLowerCase() !== props.fallbackLocale) {
			return await queryCollection('content')
				.path(`/${props.fallbackLocale}/${normalizedPage.value}`)
				.first()
		}

		return null
	},
	{ watch: [locale, normalizedPage] },
)
</script>
