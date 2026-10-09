import { matchesGlob, relative, resolve, sep } from 'node:path'
import { defineNuxtModule } from 'nuxt/kit'
import { generateEmojiFont } from './generate'
import type { EmojiFontOptions } from './types'

export default defineNuxtModule<EmojiFontOptions>({
	meta: { name: 'local-emoji-font' },
	setup(options, nuxt) {
		const rootDir = nuxt.options.rootDir
		const outputDir = resolve(nuxt.options.buildDir, 'emoji')
		nuxt.options.css.unshift(resolve(outputDir, 'emoji.css'))
		let pending = Promise.resolve()
		const generate = () => {
			const task = pending.then(() =>
				generateEmojiFont(rootDir, outputDir, options),
			)
			pending = task.then(
				() => {},
				() => {},
			)
			return task
		}
		nuxt.hook('build:before', async () => {
			if (nuxt.options._prepare) return
			const { manifest } = await generate()
			console.info(
				`[EMOJI_FONT] ${manifest.sequences.length} sequences, ${manifest.subsetBytes} bytes WOFF2`,
			)
			if (manifest.missingCodepoints.length)
				console.warn(
					'[EMOJI_FONT_UNSUPPORTED_CODEPOINTS]',
					manifest.missingCodepoints.join(', '),
				)
		})
		nuxt.hook('vite:serverCreated', (server, environment) => {
			if (environment.isServer) return
			let timer: ReturnType<typeof setTimeout> | undefined
			let closed = false
			// Watch source directories too: content and lazy locale files may not be
			// present in the Vite module graph when a new emoji is added.
			server.watcher.add(rootDir)
			const onChange = (path: string) => {
				const file = relative(rootDir, resolve(path)).split(sep).join('/')
				if (
					closed ||
					!options.include.some((pattern) => matchesGlob(file, pattern)) ||
					options.exclude.some((pattern) => matchesGlob(file, pattern))
				)
					return
				clearTimeout(timer)
				timer = setTimeout(() => {
					void generate()
						.then(({ changed, manifest }) => {
							if (!closed && changed) {
								// Nuxt's generated directory is ignored by Vite's watcher.
								// Explicitly discard its cached CSS before reloading.
								const modules = server.moduleGraph.getModulesByFile(
									resolve(outputDir, 'emoji.css'),
								)
								for (const module of modules ?? []) {
									server.moduleGraph.invalidateModule(module)
								}
								console.info(
									`[EMOJI_FONT] Updated ${manifest.sequences.length} sequences`,
								)
								server.ws.send({ type: 'full-reload' })
							}
						})
						.catch((error: unknown) => {
							if (closed) return
							console.error('[EMOJI_FONT_UPDATE_FAILED]', error)
							server.ws.send({
								type: 'error',
								err: { message: String(error), stack: '' },
							})
						})
				}, 250)
			}
			server.watcher
				.on('add', onChange)
				.on('change', onChange)
				.on('unlink', onChange)
			nuxt.hook('close', async () => {
				closed = true
				clearTimeout(timer)
				server.watcher
					.off('add', onChange)
					.off('change', onChange)
					.off('unlink', onChange)
				await pending
			})
		})
	},
})
