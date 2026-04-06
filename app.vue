<script setup lang="ts">
import { computed, watch } from 'vue'
import PageHeader from '~/layouts/PageHeader.vue'
import PageContainer from '~/layouts/PageContainer.vue'
import PageFooter from '~/layouts/PageFooter.vue'
import PageMenu from '~/layouts/PageMenu.vue'

const route = useRoute()
const { locale, t } = useI18n({ useScope: 'global' })
const toast = useToast()
const nuxtApp = useNuxtApp()

type LocaleCode = 'zh-CN' | 'ja-JP' | 'en-US'
type LocaleNameKey = 'zhCN' | 'jaJP' | 'enUS'

const CHINESE_PRIMARY_LOCALES = new Set([
	'zh',
	'cmn',
	'yue',
	'wuu',
	'hak',
	'nan',
])

const isChineseLocale = (localeTag: string): boolean => {
	if (!localeTag) {
		return false
	}

	const primary = localeTag.split('-', 1)[0] ?? ''

	if (CHINESE_PRIMARY_LOCALES.has(primary)) {
		return true
	}

	return (
		localeTag.includes('chinese') ||
		localeTag.includes('mandarin') ||
		localeTag.includes('cantonese')
	)
}

const normalizeLocaleCode = (value: string | null | undefined): LocaleCode => {
	const normalized = String(value ?? '')
		.trim()
		.toLowerCase()
		.replace(/_/g, '-')

	if (isChineseLocale(normalized)) {
		return 'zh-CN'
	}

	if (normalized.startsWith('ja')) {
		return 'ja-JP'
	}

	if (normalized.startsWith('en')) {
		return 'en-US'
	}

	return 'zh-CN'
}

const toLocaleNameKey = (localeCode: LocaleCode): LocaleNameKey => {
	if (localeCode === 'ja-JP') {
		return 'jaJP'
	}

	if (localeCode === 'en-US') {
		return 'enUS'
	}

	return 'zhCN'
}

const setNuxtLocale = (
	nuxtApp.$i18n as {
		setLocale?: (code: LocaleCode) => Promise<void>
		loadLocaleMessages?: (code: LocaleCode) => Promise<void>
	}
).setLocale

const loadLocaleMessages = (
	nuxtApp.$i18n as {
		setLocale?: (code: LocaleCode) => Promise<void>
		loadLocaleMessages?: (code: LocaleCode) => Promise<void>
	}
).loadLocaleMessages

const setAppLocale = async (nextLocale: LocaleCode): Promise<void> => {
	if (nextLocale === normalizeLocaleCode(locale.value)) {
		return
	}

	if (setNuxtLocale) {
		await setNuxtLocale(nextLocale)
		return
	}

	locale.value = nextLocale
}

const translateLocaleNotice = (
	key: string,
	promptLocale: LocaleCode,
	values: Record<string, string> = {},
): string => t(key, values, { locale: promptLocale })

const resolveLocaleDisplayName = (
	localeCode: LocaleCode,
	promptLocale: LocaleCode,
): string =>
	translateLocaleNotice(
		`localeNotice.localeNames.${toLocaleNameKey(localeCode)}`,
		promptLocale,
	)

let localeSuggestionChecked = false
let localeSuggestionBusy = false

const maybePromptLocaleSwitch = async (): Promise<void> => {
	if (!import.meta.client || localeSuggestionBusy || localeSuggestionChecked) {
		return
	}

	localeSuggestionChecked = true

	const preferredLocale = normalizeLocaleCode(useBrowserLocale())
	const currentLocale = normalizeLocaleCode(locale.value)

	if (preferredLocale === currentLocale) {
		return
	}

	localeSuggestionBusy = true

	try {
		if (loadLocaleMessages) {
			await loadLocaleMessages(preferredLocale)
		}

		const targetLanguage = resolveLocaleDisplayName(
			preferredLocale,
			preferredLocale,
		)
		const currentLanguage = resolveLocaleDisplayName(
			currentLocale,
			preferredLocale,
		)
		const switchLabel = translateLocaleNotice(
			'localeNotice.switchAction',
			preferredLocale,
			{ targetLanguage },
		)

		const toastEntry = toast.add({
			id: 'locale-switch-once',
			title: translateLocaleNotice('localeNotice.title', preferredLocale, {
				targetLanguage,
			}),
			description: translateLocaleNotice(
				'localeNotice.description',
				preferredLocale,
				{
					currentLanguage,
					targetLanguage,
				},
			),
			color: 'info',
			icon: 'i-lucide-languages',
			duration: 12000,
			actions: [
				{
					label: switchLabel,
					color: 'primary',
					onClick: () => {
						void setAppLocale(preferredLocale)
						toast.remove(toastEntry.id)
					},
				},
				{
					label: translateLocaleNotice(
						'localeNotice.keepAction',
						preferredLocale,
					),
					color: 'neutral',
					variant: 'ghost',
					onClick: () => {
						toast.remove(toastEntry.id)
					},
				},
			],
		})
	} finally {
		localeSuggestionBusy = false
	}
}

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
	void maybePromptLocaleSwitch()

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
