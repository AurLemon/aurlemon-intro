<script setup lang="ts">
import { computed, watch } from 'vue'
import PageHeader from '~/layouts/PageHeader.vue'
import PageContainer from '~/layouts/PageContainer.vue'
import PageFooter from '~/layouts/PageFooter.vue'
import PageMenu from '~/layouts/PageMenu.vue'

const route = useRoute()
const { locale, t } = useI18n({ useScope: 'global' })
const toast = useToast()

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

const resolveAuthErrorCode = (queryValue: unknown): string | null => {
	if (typeof queryValue === 'string' && queryValue) {
		return queryValue
	}

	if (Array.isArray(queryValue)) {
		for (const item of queryValue) {
			if (typeof item === 'string' && item) {
				return item
			}
		}
	}

	return null
}

if (import.meta.client) {
	watch(
		() => route.query.authError,
		(queryValue) => {
			const authErrorCode = resolveAuthErrorCode(queryValue)

			if (!authErrorCode) {
				return
			}

			const descriptionKey = resolveSocialErrorKey({
				statusMessage: authErrorCode,
			})

			toast.add({
				title: t('social.feedback.errorTitle'),
				description: t(descriptionKey),
				color: 'error',
				icon: 'i-lucide-circle-alert',
			})

			const nextQuery = { ...route.query }
			delete nextQuery.authError

			void navigateTo(
				{
					path: route.path,
					query: nextQuery,
					hash: route.hash,
				},
				{ replace: true },
			)
		},
		{ immediate: true },
	)
}
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
