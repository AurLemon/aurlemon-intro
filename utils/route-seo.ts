export interface RouteSeoDefinition {
	descriptionKey?: string
	indexable: boolean
	titleKey: string
}

const ROUTE_SEO_DEFINITIONS: Record<string, RouteSeoDefinition> = {
	'/': {
		descriptionKey: 'seo.pages.home.description',
		indexable: true,
		titleKey: 'seo.pages.home.title',
	},
	'/about': {
		descriptionKey: 'seo.pages.about.description',
		indexable: true,
		titleKey: 'seo.pages.about.title',
	},
	'/friends': {
		descriptionKey: 'seo.pages.friends.description',
		indexable: true,
		titleKey: 'seo.pages.friends.title',
	},
	'/journey': {
		indexable: false,
		titleKey: 'seo.pages.journey.title',
	},
	'/preference': {
		descriptionKey: 'seo.pages.preference.description',
		indexable: true,
		titleKey: 'seo.pages.preference.title',
	},
	'/profile': {
		descriptionKey: 'seo.pages.profile.description',
		indexable: true,
		titleKey: 'seo.pages.profile.title',
	},
	'/project': {
		descriptionKey: 'seo.pages.project.description',
		indexable: true,
		titleKey: 'seo.pages.project.title',
	},
}

const UNCONFIGURED_ROUTE_SEO_DEFINITION: RouteSeoDefinition = {
	indexable: false,
	titleKey: 'seo.pages.unconfigured.title',
}

const normalizeLocalizedPath = (path: string): string => {
	const matched = path.match(/^\/(?:zh-CN|ja-JP|en-US)(?=\/|$)(.*)$/)

	if (!matched) {
		return path
	}

	return matched[1] ? `/${matched[1].replace(/^\/+/, '')}` : '/'
}

export const getRouteSeoDefinition = (path: string): RouteSeoDefinition =>
	ROUTE_SEO_DEFINITIONS[normalizeLocalizedPath(path)] ??
	UNCONFIGURED_ROUTE_SEO_DEFINITION
