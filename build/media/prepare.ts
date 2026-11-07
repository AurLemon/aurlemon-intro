import { readFile, readdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { generateCardAtlas } from '../card-atlas/generate'
import { generate } from '../thumbnails/generate'
import { getAtlasMediaPath, getThumbnailMediaPath } from './derived'
import { readMediaFile, type MediaFile } from './files'

interface MediaManifest {
	fit?: 'contain' | 'cover' | 'portrait'
	images: Array<{ id: string; file: string }>
}

// Generate the same real cover thumbnails and atlases used by the homepage.
export const prepareDerivedMedia = async (
	rootDir: string,
): Promise<MediaFile[]> => {
	const media: MediaFile[] = []
	const assets = resolve(rootDir, 'assets')
	for (const entry of await readdir(assets, { recursive: true })) {
		if (!entry.endsWith('.card-atlas.json')) continue
		const manifestPath = resolve(assets, entry)
		const manifest: MediaManifest = JSON.parse(
			await readFile(manifestPath, 'utf8'),
		)
		const files = manifest.images.map((image) =>
			resolve(dirname(manifestPath), image.file),
		)
		for (const source of files) {
			const path = getThumbnailMediaPath(rootDir, source, 320, 320, 90)
			if (!path) continue
			const output = resolve(rootDir, '.nuxt/media', path)
			await generate({ source, output, width: 320, height: 320, quality: 90 })
			media.push(readMediaFile(output, path))
		}
		const path = getAtlasMediaPath(rootDir, manifestPath, files)
		if (!path || files.length < 2) continue
		const atlas = await generateCardAtlas(
			manifest.images.map((image, index) => ({
				id: image.id,
				file: files[index]!,
			})),
			resolve(rootDir, '.nuxt/card-atlases'),
			manifest.fit,
		)
		media.push(readMediaFile(atlas.file, path))
	}
	return [...new Map(media.map((file) => [file.relativePath, file])).values()]
}
