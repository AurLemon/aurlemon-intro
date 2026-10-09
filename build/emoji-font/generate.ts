import { createHash } from 'node:crypto'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { Agent, get } from 'node:https'
import { resolve } from 'node:path'
import emojiRegex from 'emoji-regex'
import glob from 'fast-glob'
import type { EmojiFontManifest, EmojiFontOptions } from './types'

interface FontTools {
	subset: (
		font: Uint8Array,
		options: Record<string, string | boolean>,
	) => Promise<Uint8Array>
	ttx: (font: Uint8Array, options: string[][]) => Promise<Uint8Array>
}

const hash = (value: string | Uint8Array) =>
	createHash('sha256').update(value).digest('hex')

const readOptional = async (path: string): Promise<Buffer | null> => {
	try {
		return await readFile(path)
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
		return null
	}
}

const decodeText = (text: string) =>
	text
		.replace(/\\u\{([\da-f]+)\}|\\u([\da-f]{4})/gi, (match, full, unit) => {
			const code = Number.parseInt(full || unit, 16)
			return code <= 0x10ffff ? String.fromCodePoint(code) : match
		})
		.replace(/&#(x[\da-f]+|\d+);/gi, (match, value: string) => {
			const code =
				value.startsWith('x') || value.startsWith('X')
					? Number.parseInt(value.slice(1), 16)
					: Number.parseInt(value, 10)
			return code <= 0x10ffff ? String.fromCodePoint(code) : match
		})

export async function scanEmoji(rootDir: string, options: EmojiFontOptions) {
	const paths = await glob(options.include, {
		cwd: rootDir,
		ignore: options.exclude,
		onlyFiles: true,
	})
	const sequences = new Set<string>()
	const files: string[] = []
	for (const path of paths.sort()) {
		const matches = [
			...decodeText(await readFile(resolve(rootDir, path), 'utf8')).matchAll(
				emojiRegex(),
			),
		]
		if (matches.length) files.push(path)
		for (const match of matches) sequences.add(match[0])
	}
	for (const text of options.extraEmoji) {
		for (const match of text.matchAll(emojiRegex())) sequences.add(match[0])
	}
	return { sequences: [...sequences].sort(), files }
}

async function download(
	url: string,
	proxy?: string,
	redirects = 0,
): Promise<Buffer> {
	if (redirects > 5) throw new Error('EMOJI_FONT_TOO_MANY_REDIRECTS')
	if (!url.startsWith('https://')) throw new Error('EMOJI_FONT_HTTPS_REQUIRED')
	const agent = new Agent({
		proxyEnv: proxy ? { HTTPS_PROXY: proxy } : process.env,
	})
	try {
		return await new Promise<Buffer>((accept, reject) => {
			const request = get(
				url,
				{ agent, signal: AbortSignal.timeout(120_000) },
				(response) => {
					if (
						response.statusCode &&
						response.statusCode >= 300 &&
						response.statusCode < 400 &&
						response.headers.location
					) {
						response.resume()
						accept(
							download(
								new URL(response.headers.location, url).href,
								proxy,
								redirects + 1,
							),
						)
						return
					}
					if (response.statusCode !== 200) {
						response.resume()
						reject(
							new Error(
								`EMOJI_FONT_DOWNLOAD_FAILED: HTTP ${response.statusCode}`,
							),
						)
						return
					}
					const chunks: Buffer[] = []
					response.on('data', (chunk: Buffer) => chunks.push(chunk))
					response.on('end', () => accept(Buffer.concat(chunks)))
					response.on('error', reject)
				},
			)
			request.on('error', reject)
		})
	} finally {
		agent.destroy()
	}
}

export async function generateEmojiFont(
	rootDir: string,
	outputDir: string,
	options: EmojiFontOptions,
): Promise<{ changed: boolean; manifest: EmojiFontManifest }> {
	const { sequences, files } = await scanEmoji(rootDir, options)
	const cacheKey = hash(
		JSON.stringify({
			version: 1,
			source: options.source.sha256,
			family: options.family,
			sequences,
		}),
	)
	const cacheDir = resolve(rootDir, '.cache/emoji', cacheKey)
	const manifestPath = resolve(cacheDir, 'manifest.json')
	const fontPath = resolve(cacheDir, 'emoji.woff2')
	const cssPath = resolve(outputDir, 'emoji.css')
	await mkdir(cacheDir, { recursive: true })
	await mkdir(outputDir, { recursive: true })
	const cachedManifest = await readOptional(manifestPath)
	let font = await readOptional(fontPath)
	let manifest: EmojiFontManifest
	if (cachedManifest && font) {
		manifest = { ...JSON.parse(cachedManifest.toString()), files }
	} else {
		const sourcePath = options.source.file
			? resolve(rootDir, options.source.file)
			: resolve(rootDir, '.cache/emoji', `${options.source.sha256}.ttf`)
		let source = await readOptional(sourcePath)
		if (!source && options.source.file)
			throw new Error('EMOJI_FONT_LOCAL_SOURCE_MISSING')
		if (!source) {
			console.info('[EMOJI_FONT] Downloading pinned source font')
			source = await download(options.source.url, options.proxy)
			if (hash(source) !== options.source.sha256)
				throw new Error('EMOJI_FONT_SOURCE_CHECKSUM_MISMATCH')
			const temporaryPath = `${sourcePath}.${process.pid}.tmp`
			await writeFile(temporaryPath, source)
			await rename(temporaryPath, sourcePath)
		}
		if (hash(source) !== options.source.sha256)
			throw new Error('EMOJI_FONT_SOURCE_CHECKSUM_MISMATCH')
		const tags = new Set(
			Array.from({ length: source.readUInt16BE(4) }, (_, index) =>
				source.toString('ascii', 12 + index * 16, 16 + index * 16),
			),
		)
		if (!['CBDT', 'CBLC', 'GSUB'].every((tag) => tags.has(tag))) {
			throw new Error('EMOJI_FONT_REQUIRES_COLOR_AND_GSUB_TABLES')
		}
		let unicodeRange = ''
		let missingCodepoints: string[] = []
		if (sequences.length) {
			// The adapter bundles fontTools + Brotli in WASM; no system Python needed.
			const fontTools: FontTools = (await import('@web-alchemy/fonttools'))
				.default
			font = Buffer.from(
				await fontTools.subset(source, {
					text: sequences.join('\n'),
					flavor: 'woff2',
					'layout-features': '*',
					'no-hinting': true,
				}),
			)
			const xml = Buffer.from(
				await fontTools.ttx(font, [['-q'], ['-t', 'cmap'], ['-t', 'CBLC']]),
			).toString()
			if (!xml.includes('<CBLC>') || !xml.includes('<strike '))
				throw new Error('EMOJI_FONT_COLOR_DATA_MISSING')
			const cmap = new Set(
				[...xml.matchAll(/<map code="0x([\da-f]+)"/gi)].map((match) =>
					Number.parseInt(match[1]!, 16),
				),
			)
			const codes = [
				...new Set([...sequences.join('')].map((char) => char.codePointAt(0)!)),
			].sort((a, b) => a - b)
			const format = (code: number) => `U+${code.toString(16).toUpperCase()}`
			// Do not let a bitmap font replace normal digits or punctuation.
			unicodeRange = codes
				.filter((code) => code > 0x7f && cmap.has(code))
				.map(format)
				.join(', ')
			missingCodepoints = codes
				.filter((code) => !cmap.has(code) && code !== 0xfe0f && code !== 0x200d)
				.map(format)
		} else {
			font = Buffer.alloc(0)
		}
		manifest = {
			cacheKey,
			family: options.family,
			sequences,
			files,
			unicodeRange,
			missingCodepoints,
			sourceBytes: source.length,
			subsetBytes: font.length,
		}
		await writeFile(fontPath, font)
		await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
	}
	const css = manifest.unicodeRange
		? `@font-face {\n  font-family: ${JSON.stringify(options.family)};\n  src: url('./emoji.woff2?v=${cacheKey}') format('woff2');\n  font-style: normal;\n  font-weight: 100 900;\n  font-display: swap;\n  unicode-range: ${manifest.unicodeRange};\n}\n`
		: '/* No emoji in the configured source files. */\n'
	const changed = (await readOptional(cssPath))?.toString() !== css
	if (
		changed ||
		!(await readOptional(resolve(outputDir, 'emoji.woff2')))?.equals(font)
	) {
		await writeFile(resolve(outputDir, 'emoji.woff2'), font)
		await writeFile(cssPath, css)
	}
	await writeFile(
		resolve(outputDir, 'manifest.json'),
		`${JSON.stringify(manifest, null, 2)}\n`,
	)
	return { changed, manifest }
}
