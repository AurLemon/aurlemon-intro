export interface EmojiFontSource {
	url: string
	sha256: string
	/** Optional local source with the same checksum; never served to visitors. */
	file?: string
}

export interface EmojiFontOptions {
	family: string
	include: string[]
	exclude: string[]
	extraEmoji: string[]
	source: EmojiFontSource
	/** HTTP(S) proxy used only for the source download. */
	proxy?: string
}

export interface EmojiFontManifest {
	cacheKey: string
	family: string
	sequences: string[]
	files: string[]
	unicodeRange: string
	missingCodepoints: string[]
	sourceBytes: number
	subsetBytes: number
}
