import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, extname, resolve } from 'node:path'
import { addVitePlugin, defineNuxtModule } from 'nuxt/kit'
import sharp from 'sharp'

interface Thumbnail {
	source: string
	output: string
	width: number
	height: number
	quality: number
}

const pending = new Map<string, Promise<void>>()

async function generate(image: Thumbnail) {
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
			throw new Error('缩略图只支持静态图片，请直接引用动画资源')
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

function integer(
	params: URLSearchParams,
	key: string,
	fallback: number,
	max: number,
) {
	const value = Number(params.get(key) ?? fallback)
	if (!Number.isInteger(value) || value < 1 || value > max)
		throw new Error(`缩略图参数 ${key} 必须为 1–${max} 的整数`)
	return value
}

export default defineNuxtModule({
	meta: { name: 'local-thumbnails' },
	setup(_options, nuxt) {
		const images = new Map<string, Thumbnail>()
		const cacheDirectory = resolve(nuxt.options.buildDir, 'thumbnails')
		addVitePlugin(() => ({
			name: 'local-thumbnails',
			enforce: 'pre',
			async resolveId(id, importer) {
				const index = id.indexOf('?')
				if (index < 0) return null
				const params = new URLSearchParams(id.slice(index + 1))
				if (!params.has('thumbnail')) return null
				for (const key of params.keys())
					if (!['thumbnail', 'w', 'h', 'q'].includes(key))
						throw new Error(`不支持的缩略图参数：${key}`)
				const resolved = await this.resolve(id.slice(0, index), importer, {
					skipSelf: true,
				})
				if (!resolved || resolved.external)
					throw new Error(`无法解析本地缩略图：${id}`)
				const source = resolved.id.split('?')[0]!
				if (
					!['.png', '.jpg', '.jpeg', '.webp', '.avif'].includes(
						extname(source).toLowerCase(),
					)
				)
					throw new Error('缩略图仅支持本地 PNG、JPEG、WebP、AVIF 图片')
				const width = integer(params, 'w', 320, 4096)
				const height = integer(params, 'h', width, 4096)
				const quality = integer(params, 'q', 90, 100)
				const key = createHash('sha256')
					.update(JSON.stringify({ source, width, height, quality }))
					.digest('hex')
					.slice(0, 24)
				const image = {
					source,
					width,
					height,
					quality,
					output: resolve(cacheDirectory, `${key}.webp`),
				}
				images.set(image.output, image)
				this.addWatchFile(source)
				await generate(image)
				return `${image.output}?url`
			},
		}))
		nuxt.hook('vite:serverCreated', (server, environment) => {
			if (!environment.isClient) return
			let closed = false
			let updates = Promise.resolve()
			server.watcher.add(nuxt.options.rootDir)
			const onChange = (file: string) => {
				const changed = [...images.values()].filter(
					(image) => image.source === file,
				)
				if (!changed.length || closed) return
				updates = updates
					.then(async () => {
						if (closed) return
						await Promise.all(changed.map(generate))
						if (closed) return
						// 生成目录不受 Vite 文件监听管理，显式失效并刷新客户端。
						server.moduleGraph.invalidateAll()
						server.ws.send({ type: 'full-reload' })
					})
					.catch((error: unknown) => {
						if (!closed)
							server.ws.send({
								type: 'error',
								err: { message: String(error), stack: '' },
							})
					})
			}
			server.watcher
				.on('add', onChange)
				.on('change', onChange)
				.on('unlink', onChange)
			nuxt.hook('close', async () => {
				closed = true
				server.watcher
					.off('add', onChange)
					.off('change', onChange)
					.off('unlink', onChange)
				await updates
			})
		})
	},
})
