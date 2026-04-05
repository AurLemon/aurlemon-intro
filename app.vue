<script setup lang="ts">
import { computed } from 'vue'
import PageHeader from '~/layouts/PageHeader.vue'
import PageContainer from '~/layouts/PageContainer.vue'
import PageFooter from '~/layouts/PageFooter.vue'
import PageMenu from '~/layouts/PageMenu.vue'

const route = useRoute()
const { locale, t } = useI18n()

const normalizePath = (path: string): string => {
	const matched = path.match(/^\/(?:zh-CN|ja-JP|en-US)(?=\/|$)(.*)$/)
	if (!matched) {
		return path
	}

	return matched[1] ? `/${matched[1].replace(/^\/+/, '')}` : '/'
}

const pageTitle = computed(() => {
	const siteName = t('header.siteName')
	const normalizedPath = normalizePath(route.path)

	if (normalizedPath === '/') {
		return siteName
	}

	const routeToLabelKey: Record<string, string> = {
		'/project': 'menu.project',
		'/profile': 'menu.profile',
		'/preference': 'menu.preference',
		'/about': 'menu.about',
		'/friends': 'menu.friends',
	}

	const labelKey = routeToLabelKey[normalizedPath] || 'menu.currentPage'
	return `${t(labelKey)} / ${siteName}`
})

useHead(() => ({
	htmlAttrs: {
		lang: locale.value,
	},
	title: pageTitle.value,
}))
</script>

<template>
	<UApp
		:toaster="{
			position: 'top-right',
			ui: {
				viewport: 'z-[60000]',
			},
		}"
	>
		<div class="flex flex-col min-h-[105vh]">
			<PageHeader />
			<PageContainer />
			<PageFooter />
			<PageMenu />
		</div>
	</UApp>
</template>
