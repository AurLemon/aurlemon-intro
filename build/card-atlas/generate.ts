import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import sharp from 'sharp'
import type { CardAtlasRegion } from '../../shared/types/card-image-atlas.ts'

export interface AtlasInput {
	id: string
	file: string
}
export interface GeneratedCardAtlas {
	file: string
	width: number
	height: number
	regions: CardAtlasRegion[]
}

export const MAX_CARD_ATLAS_IMAGES = 32
const TILE_SIZE = 160
const MAX_BYTES = 200 * 1024
const QUALITY = 85
const pending = new Map<string, Promise<GeneratedCardAtlas>>()

export async function generateCardAtlas(
	images: readonly AtlasInput[],
	cacheDirectory: string,
	fit: 'contain' | 'cover' | 'portrait' = 'cover',
): Promise<GeneratedCardAtlas> {
	if (images.length < 2 || images.length > MAX_CARD_ATLAS_IMAGES)
		throw new Error(
			`Multi-image atlases require between 2 and ${MAX_CARD_ATLAS_IMAGES} images`,
		)
	const inputs = await Promise.all(images.map((image) => readFile(image.file)))
	const fingerprint = createHash('sha256').update(
		JSON.stringify({
			version: 4,
			fit,
			tile: TILE_SIZE,
			quality: QUALITY,
			images,
			sharp: sharp.versions.sharp,
		}),
	)
	for (const input of inputs) fingerprint.update(input)
	const file = resolve(
		cacheDirectory,
		`${fingerprint.digest('hex').slice(0, 32)}.webp`,
	)
	const running = pending.get(file)
	if (running) return running
	const task = (async () => {
		const resized = await Promise.all(
			inputs.map(async (input) => {
				if (((await sharp(input).metadata()).pages ?? 1) > 1)
					throw new Error('Card atlases do not support animated images')
				const image = sharp(input).autoOrient()
				if (fit === 'portrait') image.resize({ width: 112 })
				else image.resize(TILE_SIZE, TILE_SIZE, { fit, background: '#0000' })
				return image.png().toBuffer({ resolveWithObject: true })
			}),
		)
		const columns = Math.ceil(Math.sqrt(images.length))
		const rowHeight = Math.max(
			TILE_SIZE,
			...resized.map((image) => image.info.height),
		)
		const width = columns * TILE_SIZE
		const height = Math.ceil(images.length / columns) * rowHeight
		const regions = images.map((image, index) => ({
			id: image.id,
			x: (index % columns) * TILE_SIZE,
			y: Math.floor(index / columns) * rowHeight,
			width: resized[index]!.info.width,
			height: resized[index]!.info.height,
		}))
		try {
			const cached = await readFile(file)
			if (cached.byteLength > MAX_BYTES)
				throw new Error('Cached atlas exceeds the size budget')
			return { file, width, height, regions }
		} catch {
			// 未命中缓存时一次生成，原始图片不变。
		}
		const tiles = resized.map((image, index) => ({
			input: image.data,
			left: regions[index]!.x,
			top: regions[index]!.y,
		}))
		const data = await sharp({
			create: {
				width,
				height,
				channels: 4,
				background: { r: 0, g: 0, b: 0, alpha: 0 },
			},
		})
			.composite(tiles)
			.webp({ quality: QUALITY, alphaQuality: 100, effort: 6 })
			.toBuffer()
		if (data.byteLength > MAX_BYTES)
			throw new Error(
				'Card atlas exceeds 200 KiB; reduce the number of images or compress the assets',
			)
		await mkdir(cacheDirectory, { recursive: true })
		await writeFile(file, data)
		return { file, width, height, regions }
	})()
	pending.set(file, task)
	try {
		return await task
	} finally {
		pending.delete(file)
	}
}
