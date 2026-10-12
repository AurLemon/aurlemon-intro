import { readFile } from 'node:fs/promises'
import { resolve, sep } from 'node:path'
import { addVitePlugin, defineNuxtModule } from 'nuxt/kit'
import { analyzeCardMaterial, readAppearancePalette } from './analyze'
import type { CardSvgMotif } from '../../shared/types/card-appearance'

const PREFIX = '\0card-appearance:'

export default defineNuxtModule({
	meta: { name: 'card-appearance' },
	setup(_options, nuxt) {
		const assets = resolve(nuxt.options.rootDir, 'assets')
		const paletteFile = resolve(assets, 'styles/base/tailwind.css')
		const dependencies = new Set<string>([paletteFile])
		addVitePlugin(() => ({
			name: 'card-appearance',
			enforce: 'pre',
			async resolveId(id, importer) {
				if (!id.endsWith('?appearance')) return null
				const source = await this.resolve(id.slice(0, -11), importer, {
					skipSelf: true,
				})
				if (!source || !source.id.startsWith(assets + sep))
					throw new Error(`只能分析本地卡片素材：${id}`)
				return PREFIX + source.id + '.js'
			},
			async load(id) {
				if (!id.startsWith(PREFIX)) return null
				const file = id.slice(PREFIX.length, -3)
				dependencies.add(file)
				this.addWatchFile(file)
				this.addWatchFile(paletteFile)
				const input = await readFile(file)
				const palette = await readAppearancePalette(paletteFile)
				if (file.endsWith('.card-motifs.json')) {
					const manifest = JSON.parse(input.toString()) as {
						motifs: CardSvgMotif[]
					}
					if (
						!Array.isArray(manifest.motifs) ||
						manifest.motifs.length < 1 ||
						manifest.motifs.some((m) => !m.id || !m.svg?.startsWith('<svg '))
					)
						throw new Error(`无效的 SVG 素材清单：${file}`)
					const profiles = Object.fromEntries(
						await Promise.all(
							manifest.motifs.map(async (m) => [
								m.id,
								await analyzeCardMaterial(Buffer.from(m.svg), palette, {
									svg: true,
								}),
							]),
						),
					)
					return `export default ${JSON.stringify({ motifs: manifest.motifs, profiles })}`
				}
				return `export default ${JSON.stringify(await analyzeCardMaterial(input, palette, { fit: 'contain' }))}`
			},
		}))
		nuxt.hook('vite:serverCreated', (server, environment) => {
			if (!environment.isClient) return
			const reload = (file: string) => {
				if (!dependencies.has(file)) return
				server.moduleGraph.invalidateAll()
				server.ws.send({ type: 'full-reload' })
			}
			server.watcher.on('change', reload)
			nuxt.hook('close', () => {
				server.watcher.off('change', reload)
			})
		})
	},
})
