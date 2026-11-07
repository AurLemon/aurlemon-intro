import { createHash } from 'node:crypto'
import { readdirSync, readFileSync } from 'node:fs'
import { extname, join, posix } from 'node:path'

const mediaTypes: Record<string, string> = {
	'.avif': 'image/avif',
	'.gif': 'image/gif',
	'.jpeg': 'image/jpeg',
	'.jpg': 'image/jpeg',
	'.png': 'image/png',
	'.svg': 'image/svg+xml',
	'.webp': 'image/webp',
	'.mp4': 'video/mp4',
	'.webm': 'video/webm',
}

export interface MediaFile {
	relativePath: string
	absolutePath: string
	hash: string
	bytes: number
	contentType: string
	versionedPath: string
}

export const isMediaFile = (path: string): boolean =>
	Boolean(mediaTypes[extname(path).toLowerCase()])

export const readMediaFile = (
	absolutePath: string,
	relativePath: string,
): MediaFile => {
	const body = readFileSync(absolutePath)
	if (
		body
			.subarray(0, 128)
			.toString()
			.startsWith('version https://git-lfs.github.com/spec/v1')
	)
		throw new Error(`MEDIA_LFS_OBJECT_MISSING: ${relativePath}`)
	const extension = extname(relativePath)
	const contentType = mediaTypes[extension.toLowerCase()]
	if (!contentType) throw new Error(`UNSUPPORTED_MEDIA_TYPE: ${relativePath}`)
	const hash = createHash('sha256').update(body).digest('hex')
	const basename = posix.basename(relativePath, extension)
	return {
		relativePath,
		absolutePath,
		hash,
		bytes: body.length,
		contentType,
		versionedPath: posix.join(
			posix.dirname(relativePath),
			`${basename}.${hash}${extension}`,
		),
	}
}

export const collectMediaFiles = (directory: string): MediaFile[] => {
	const files: MediaFile[] = []
	const visit = (relativeDirectory: string) => {
		for (const entry of readdirSync(join(directory, relativeDirectory), {
			withFileTypes: true,
		})) {
			if (entry.name.startsWith('.')) continue
			const path = posix.join(relativeDirectory, entry.name)
			if (entry.isDirectory()) visit(path)
			else if (entry.isFile())
				files.push(readMediaFile(join(directory, path), path))
			else throw new Error(`MEDIA_SYMLINK_OR_SPECIAL_FILE: ${path}`)
		}
	}
	visit('')
	return files.sort((a, b) => a.relativePath.localeCompare(b.relativePath))
}

export const normalizeMediaBaseUrl = (value: string): string => {
	const url = new URL(value)
	if (
		url.protocol !== 'https:' ||
		url.username ||
		url.password ||
		url.search ||
		url.hash
	)
		throw new Error('INVALID_SITE_MEDIA_BASE_URL')
	return url.href.replace(/\/+$/, '')
}

export const getMediaPublicUrl = (baseUrl: string, file: MediaFile): string =>
	`${normalizeMediaBaseUrl(baseUrl)}/${file.versionedPath.split('/').map(encodeURIComponent).join('/')}`
