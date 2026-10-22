import type { SiteBuildInfo } from '../shared/types/site-meta'

declare module 'nuxt/schema' {
	interface RuntimeConfig {
		siteBuild: SiteBuildInfo
	}
}

export {}
