import { useI18n } from 'vue-i18n'

export const useLocalizedContentDoc = async (
	page: MaybeRefOrGetter<string>,
	fallbackLocale: MaybeRefOrGetter<string> = 'zh-cn',
) => {
	const { locale } = useI18n({ useScope: 'global' })

	const normalizedPage = computed(() => toValue(page).replace(/^\/+|\/+$/g, ''))
	const normalizedFallbackLocale = computed(() =>
		toValue(fallbackLocale).toLowerCase(),
	)

	return await useAsyncData(
		() => `content-${normalizedPage.value}-${locale.value}`,
		async () => {
			const localizedPath = `/${locale.value.toLowerCase()}/${normalizedPage.value}`
			const localizedDoc = await queryCollection('content')
				.path(localizedPath)
				.first()

			if (localizedDoc) {
				return localizedDoc
			}

			if (locale.value.toLowerCase() !== normalizedFallbackLocale.value) {
				return await queryCollection('content')
					.path(`/${normalizedFallbackLocale.value}/${normalizedPage.value}`)
					.first()
			}

			return null
		},
		{ watch: [locale, normalizedPage, normalizedFallbackLocale] },
	)
}
