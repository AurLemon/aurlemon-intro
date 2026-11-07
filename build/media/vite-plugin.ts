import { isAbsolute, relative, resolve, sep } from 'node:path'
import { getMediaPublicUrl, isMediaFile, readMediaFile } from './files'

interface MediaUrlPluginOptions {
	rootDir: string
	publicBaseUrl: string
}

export const createMediaUrlPlugin = (options: MediaUrlPluginOptions) => {
	const mediaDirectory = resolve(options.rootDir, 'assets/media')
	const urls = new Map<string, string>()
	return {
		name: 'intro-media-urls',
		enforce: 'pre' as const,
		apply: 'build' as const,
		load(id: string) {
			if (!options.publicBaseUrl) return
			const [filePath, query = ''] = id.split('?')
			if (!filePath || !isMediaFile(filePath)) return
			const parameters = new URLSearchParams(query)
			if (
				[...parameters.keys()].some((key) => !['url', 'import'].includes(key))
			)
				return
			const path = relative(mediaDirectory, filePath).split(sep).join('/')
			if (path.startsWith('../') || isAbsolute(path)) return
			let url = urls.get(path)
			if (!url) {
				url = getMediaPublicUrl(
					options.publicBaseUrl,
					readMediaFile(filePath, path),
				)
				urls.set(path, url)
			}
			return { code: `export default ${JSON.stringify(url)}`, map: null }
		},
	}
}
