import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

export interface MenuItem {
	key: string
	label: string
	to: string
	isFallback?: boolean
}

export const usePageMenuNavigation = () => {
	const route = useRoute()
	const localePath = useLocalePath()
	const { t } = useI18n({ useScope: 'global' })
	const baseNavItems = computed<MenuItem[]>(() => [
		{ key: 'overview', label: t('menu.overview'), to: '/' },
		{ key: 'project', label: t('menu.project'), to: '/project' },
		{ key: 'profile', label: t('menu.profile'), to: '/profile' },
		{ key: 'journey', label: t('menu.journey'), to: '/journey' },
		{ key: 'preference', label: t('menu.preference'), to: '/preference' },
	])

	const resolveTo = (item: MenuItem): string => localePath(item.to)

	const normalizePath = (path: string): string => {
		const matched = path.match(/^\/(?:zh-CN|ja-JP|en-US)(?=\/|$)(.*)$/)
		if (!matched) {
			return path
		}

		return matched[1] ? `/${matched[1].replace(/^\/+/, '')}` : '/'
	}

	const isPathActive = (
		item: MenuItem,
		currentPath: string = route.path,
	): boolean => {
		const target = resolveTo(item)
		if (item.to === '/') {
			return currentPath === target
		}
		return currentPath === target || currentPath.startsWith(`${target}/`)
	}

	const currentFallback = computed<MenuItem | null>(() => {
		const hasCurrent = baseNavItems.value.some((item) => isPathActive(item))
		if (hasCurrent) {
			return null
		}

		const routeToLabelKey: Record<string, string> = {
			'/': 'menu.overview',
			'/project': 'menu.project',
			'/profile': 'menu.profile',
			'/journey': 'menu.journey',
			'/preference': 'menu.preference',
			'/about': 'menu.about',
			'/friends': 'menu.friends',
		}

		const normalizedPath = normalizePath(route.path)
		const fallbackLabel = t(
			routeToLabelKey[normalizedPath] || 'menu.currentPage',
		)

		return {
			key: route.fullPath || route.path,
			label: fallbackLabel,
			to: route.fullPath || route.path,
			isFallback: true,
		}
	})

	const displayNavItems = computed<MenuItem[]>(() =>
		currentFallback.value
			? [...baseNavItems.value, currentFallback.value]
			: baseNavItems.value,
	)

	return {
		route,
		baseNavItems,
		currentFallback,
		displayNavItems,
		resolveTo,
		isPathActive,
	}
}
