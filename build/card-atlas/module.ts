import { readFile } from 'node:fs/promises'
import { dirname, extname, resolve, sep } from 'node:path'
import { addVitePlugin, defineNuxtModule } from 'nuxt/kit'
import { generateCardAtlas, MAX_CARD_ATLAS_IMAGES } from './generate'
import sharp from 'sharp'
import type { CardCoverMetadata } from '../../shared/types/card-image-atlas'
import {
	analyzeCardMaterial,
	readAppearancePalette,
} from '../card-appearance/analyze'

interface AtlasSource extends Partial<CardCoverMetadata> {
	id: string
	file: string
}
interface AtlasManifest {
	fit?: 'contain' | 'cover' | 'portrait'
	images: AtlasSource[]
}
interface AtlasDependency {
	manifest: string
	files: string[]
}

const MAX_IMAGES = MAX_CARD_ATLAS_IMAGES
const COVERS_PREFIX = '\0card-image-covers:'
const VIRTUAL_PREFIX = '\0card-image-atlas:'

function hasValidCoverMetadata(image: object): boolean {
	if (
		!['title', 'author', 'category', 'album', 'href', 'releaseDate'].some(
			(key) => key in image,
		)
	)
		return true
	return (
		'title' in image &&
		typeof image.title === 'string' &&
		image.title.length > 0 &&
		'author' in image &&
		Array.isArray(image.author) &&
		image.author.length > 0 &&
		image.author.every(
			(author: unknown) => typeof author === 'string' && author.length > 0,
		) &&
		'category' in image &&
		typeof image.category === 'string' &&
		/^[a-zA-Z][a-zA-Z0-9]*$/.test(image.category) &&
		(!('album' in image) || typeof image.album === 'string') &&
		'releaseDate' in image &&
		typeof image.releaseDate === 'string' &&
		/^\d{4}-\d{2}-\d{2}$/.test(image.releaseDate) &&
		'href' in image &&
		typeof image.href === 'string' &&
		/^https:\/\/(bgm\.tv\/subject\/\d+|music\.163\.com\/#\/(song|album)\?id=\d+)$/.test(
			image.href,
		)
	)
}

function isManifest(value: unknown): value is AtlasManifest {
	if (!value || typeof value !== 'object' || !('images' in value)) return false
	return (
		(!('fit' in value) ||
			value.fit === 'contain' ||
			value.fit === 'cover' ||
			value.fit === 'portrait') &&
		Array.isArray(value.images) &&
		value.images.every(
			(image: unknown) =>
				image !== null &&
				typeof image === 'object' &&
				'id' in image &&
				typeof image.id === 'string' &&
				'file' in image &&
				typeof image.file === 'string' &&
				hasValidCoverMetadata(image),
		)
	)
}

export default defineNuxtModule({
	meta: { name: 'card-image-atlas' },
	setup(_options, nuxt) {
		const dependencies = new Map<string, AtlasDependency>()
		const assetRoot = resolve(nuxt.options.rootDir, 'assets')
		const cacheDirectory = resolve(nuxt.options.buildDir, 'card-atlases')
		const paletteFile = resolve(assetRoot, 'styles/base/tailwind.css')
		addVitePlugin(() => ({
			name: 'card-image-atlas',
			enforce: 'pre',
			async resolveId(id, importer) {
				const covers = id.endsWith('.card-atlas.json?covers')
				if (!covers && !id.endsWith('.card-atlas.json?atlas')) return null
				const resolved = await this.resolve(
					id.slice(0, id.lastIndexOf('?')),
					importer,
					{
						skipSelf: true,
					},
				)
				if (!resolved || resolved.external)
					throw new Error(`Unable to resolve card atlas manifest: ${id}`)
				return (covers ? COVERS_PREFIX : VIRTUAL_PREFIX) + resolved.id + '.js'
			},
			async load(id) {
				const covers = id.startsWith(COVERS_PREFIX)
				if (!covers && !id.startsWith(VIRTUAL_PREFIX)) return null
				const prefix = covers ? COVERS_PREFIX : VIRTUAL_PREFIX
				const manifestPath = resolve(id.slice(prefix.length, -3))
				const manifest: unknown = JSON.parse(
					await readFile(manifestPath, 'utf8'),
				)
				if (
					!isManifest(manifest) ||
					manifest.images.length < 1 ||
					manifest.images.length > MAX_IMAGES
				)
					throw new Error(
						`Card atlases require between 1 and ${MAX_IMAGES} local images: ${manifestPath}`,
					)
				const ids = new Set<string>()
				const files = manifest.images.map((image) => {
					if (!/^[a-zA-Z0-9_-]+$/.test(image.id) || ids.has(image.id))
						throw new Error(
							`Atlas IDs must be unique and contain only ASCII letters, digits, hyphens, or underscores: ${image.id}`,
						)
					ids.add(image.id)
					const file = resolve(dirname(manifestPath), image.file)
					if (
						!file.startsWith(assetRoot + sep) ||
						!['.png', '.jpg', '.jpeg', '.webp', '.avif'].includes(
							extname(file).toLowerCase(),
						)
					)
						throw new Error(
							`Atlases only accept local static images within assets: ${image.file}`,
						)
					return file
				})
				dependencies.set(manifestPath, { manifest: manifestPath, files })
				this.addWatchFile(manifestPath)
				for (const file of files) this.addWatchFile(file)
				if (covers) {
					const imports = files
						.map(
							(file, index) =>
								`import cover${index} from ${JSON.stringify(file + '?w=320&q=90&thumbnail')}`,
						)
						.join(';')
					const entries = manifest.images
						.map(
							(image, index) =>
								`{...${JSON.stringify({ id: image.id, title: image.title, author: image.author, category: image.category, album: image.album, href: image.href, releaseDate: image.releaseDate })},url:cover${index}}`,
						)
						.join(',')
					return `${imports};export default [${entries}]`
				}
				this.addWatchFile(paletteFile)
				const palette = await readAppearancePalette(paletteFile)

				// 单图直接复用前景 320px 缩略图，既不拼接，也不额外下载一张图集。
				if (files.length === 1) {
					const profile = await analyzeCardMaterial(
						await readFile(files[0]!),
						palette,
					)
					return `import url from ${JSON.stringify(files[0] + '?w=320&q=90&thumbnail')}; export default {url,width:1,height:1,regions:[{id:${JSON.stringify(manifest.images[0]!.id)},x:0,y:0,width:1,height:1,profile:${JSON.stringify(profile)}}]}`
				}

				const atlas = await generateCardAtlas(
					manifest.images.map((image, index) => ({
						id: image.id,
						file: files[index]!,
					})),
					cacheDirectory,
					manifest.fit,
				)
				for (const region of atlas.regions) {
					const tile = await sharp(atlas.file)
						.extract({
							left: region.x,
							top: region.y,
							width: region.width,
							height: region.height,
						})
						.png()
						.toBuffer()
					region.profile = await analyzeCardMaterial(tile, palette, {
						fit: manifest.fit === 'portrait' ? 'contain' : 'cover',
					})
				}
				return `import url from ${JSON.stringify(atlas.file + '?url')}; export default {url,width:${atlas.width},height:${atlas.height},regions:${JSON.stringify(atlas.regions)}}`
			},
		}))
		// 清单或素材更新后刷新页面，重新按内容指纹生成图集。
		nuxt.hook('vite:serverCreated', (server, environment) => {
			if (!environment.isClient) return
			const onChange = (file: string) => {
				if (
					file !== paletteFile &&
					![...dependencies.values()].some(
						(entry) => entry.manifest === file || entry.files.includes(file),
					)
				)
					return
				server.moduleGraph.invalidateAll()
				server.ws.send({ type: 'full-reload' })
			}
			server.watcher
				.on('add', onChange)
				.on('change', onChange)
				.on('unlink', onChange)
			nuxt.hook('close', () => {
				server.watcher
					.off('add', onChange)
					.off('change', onChange)
					.off('unlink', onChange)
			})
		})
	},
})
