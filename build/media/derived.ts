import { isAbsolute, relative, resolve, sep } from 'node:path'
import { getMediaPublicUrl, readMediaFile } from './files'

export const getThumbnailMediaPath = (
	rootDir: string,
	source: string,
	width: number,
	height: number,
	quality: number,
): string | null => {
	const path = relative(resolve(rootDir, 'assets/media'), source)
		.split(sep)
		.join('/')
	if (path.startsWith('../') || isAbsolute(path)) return null
	return `_derived/thumbnails/${path}.${width}x${height}.q${quality}.webp`
}

export const getAtlasMediaPath = (
	rootDir: string,
	manifestPath: string,
	files: string[],
): string | null => {
	if (!files.some((file) => getThumbnailMediaPath(rootDir, file, 320, 320, 90)))
		return null
	const path = relative(resolve(rootDir, 'assets'), manifestPath)
		.split(sep)
		.join('/')
	return `_derived/atlases/${path}.webp`
}

export const getDerivedMediaUrl = (file: string, path: string): string =>
	getMediaPublicUrl(
		process.env.NUXT_PUBLIC_SITE_MEDIA_BASE_URL!,
		readMediaFile(file, path),
	)
