import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import sharp from 'sharp'

export interface Thumbnail {
	source: string
	output: string
	width: number
	height: number
	quality: number
}

const pending = new Map<string, Promise<void>>()

export async function generate(image: Thumbnail) {
	const running = pending.get(image.output)
	if (running) return running
	const task = (async () => {
		const input = await readFile(image.source)
		const fingerprint = createHash('sha256')
			.update(input)
			.update(
				JSON.stringify({
					width: image.width,
					height: image.height,
					quality: image.quality,
					sharp: sharp.versions.sharp,
				}),
			)
			.digest('hex')
		try {
			if ((await readFile(`${image.output}.hash`, 'utf8')) === fingerprint) {
				await readFile(image.output)
				return
			}
		} catch {
			/* 缓存缺失时生成，原图保持不变。 */
		}
		const metadata = await sharp(input).metadata()
		if ((metadata.pages ?? 1) > 1)
			throw new Error(
				'Thumbnails only support static images; reference animated assets directly',
			)
		const data = await sharp(input)
			.autoOrient()
			.resize({
				width: image.width,
				height: image.height,
				fit: 'inside',
				withoutEnlargement: true,
			})
			.webp({ quality: image.quality, alphaQuality: 100, effort: 6 })
			.toBuffer()
		await mkdir(dirname(image.output), { recursive: true })
		await writeFile(image.output, data)
		await writeFile(`${image.output}.hash`, fingerprint)
	})()
	pending.set(image.output, task)
	try {
		await task
	} finally {
		pending.delete(image.output)
	}
}
