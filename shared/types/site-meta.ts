export interface SiteBuildInfo {
	commit: string
	committedAt: string
	dependencies: { name: string; version: string }[]
}

export interface SiteServiceStatus {
	id: 'github' | 'bangumi' | 'githubOAuth' | 'linuxdo' | 'database' | 'email'
	state:
		| 'cached'
		| 'stale'
		| 'unknown'
		| 'available'
		| 'configured'
		| 'unconfigured'
		| 'degraded'
		| 'unavailable'
	updatedAt?: string
}

export interface SiteMetaResponse {
	build: SiteBuildInfo
	runtime: {
		node: string
		v8: string
		platform: string
		architecture: string
		timezone: string
	}
	services: SiteServiceStatus[]
}
