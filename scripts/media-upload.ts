import 'dotenv/config'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parseArgs } from 'node:util'
import COS from 'cos-nodejs-sdk-v5'
import { prepareDerivedMedia } from '../build/media/prepare'
import {
	collectMediaFiles,
	getMediaPublicUrl,
	normalizeMediaBaseUrl,
} from '../build/media/files'

const { values } = parseArgs({
	options: {
		write: { type: 'boolean', default: false },
		file: { type: 'string' },
	},
})
const requireEnv = (name: string): string => {
	const value = process.env[name]?.trim()
	if (!value) throw new Error(`MEDIA_CONFIG_MISSING: ${name}`)
	return value
}
const prefix = (process.env.COS_MEDIA_PREFIX ?? 'intro').replace(
	/^\/+|\/+$/g,
	'',
)
if (!prefix || prefix.split('/').some((part) => !/^[a-zA-Z0-9_-]+$/.test(part)))
	throw new Error('INVALID_COS_MEDIA_PREFIX')
const files = [
	...collectMediaFiles(resolve('assets/media')),
	...(await prepareDerivedMedia(resolve('.'))),
].filter((file) => !values.file || file.relativePath === values.file)
if (!files.length) throw new Error('MEDIA_FILES_NOT_FOUND')

if (!values.write) {
	console.log(
		JSON.stringify(
			{
				mode: 'dry-run',
				files: files.length,
				derivedFiles: files.filter((file) =>
					file.relativePath.startsWith('_derived/'),
				).length,
				bytes: files.reduce((sum, file) => sum + file.bytes, 0),
				sampleKeys: files
					.filter(
						(file, index) =>
							index < 3 || file.relativePath.startsWith('_derived/'),
					)
					.map((file) => `${prefix}/${file.versionedPath}`),
			},
			null,
			2,
		),
	)
} else {
	const baseUrl = normalizeMediaBaseUrl(
		requireEnv('NUXT_PUBLIC_SITE_MEDIA_BASE_URL'),
	)
	if (
		decodeURIComponent(new URL(baseUrl).pathname).replace(/^\/+|\/+$/g, '') !==
		prefix
	)
		throw new Error('MEDIA_PUBLIC_URL_PREFIX_MISMATCH')
	const bucket = requireEnv('COS_MEDIA_BUCKET')
	const region = requireEnv('COS_MEDIA_REGION')
	const cos = new COS({
		SecretId: requireEnv('COS_MEDIA_SECRET_ID'),
		SecretKey: requireEnv('COS_MEDIA_SECRET_KEY'),
	})
	let uploaded = 0
	let skipped = 0
	for (const file of files) {
		const params = {
			Bucket: bucket,
			Region: region,
			Key: `${prefix}/${file.versionedPath}`,
		}
		try {
			await cos.headObject(params)
			skipped++
			continue
		} catch (error: unknown) {
			if (
				!error ||
				typeof error !== 'object' ||
				!('statusCode' in error) ||
				error.statusCode !== 404
			)
				// eslint-disable-next-line preserve-caught-error -- COS errors can contain signed request details.
				throw new Error(`MEDIA_OBJECT_LOOKUP_FAILED: ${file.relativePath}`)
		}
		const body = readFileSync(file.absolutePath)
		if (createHash('sha256').update(body).digest('hex') !== file.hash)
			throw new Error(`MEDIA_CHANGED_DURING_UPLOAD: ${file.relativePath}`)
		try {
			await cos.putObject({
				...params,
				Body: body,
				ContentLength: body.length,
				ContentType: file.contentType,
				Headers: {
					'Content-MD5': createHash('md5').update(body).digest('base64'),
				},
				'x-cos-meta-sha256': file.hash,
				CacheControl: 'public, max-age=31536000, immutable',
			})
		} catch {
			throw new Error(`MEDIA_OBJECT_UPLOAD_FAILED: ${file.relativePath}`)
		}
		uploaded++
		console.log(`MEDIA_UPLOADED ${file.relativePath}`)
	}
	console.log(
		JSON.stringify({
			uploaded,
			skipped,
			files: files.length,
			sampleUrl: getMediaPublicUrl(baseUrl, files[0]!),
		}),
	)
}
