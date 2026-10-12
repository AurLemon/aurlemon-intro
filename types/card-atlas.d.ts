declare module '*.card-atlas.json?atlas' {
	const atlas: import('../shared/types/card-image-atlas').CardImageAtlas
	export default atlas
}

declare module '*.card-atlas.json?covers' {
	const covers: readonly import('../shared/types/card-image-atlas').CardImageCover[]
	export default covers
}
