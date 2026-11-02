import type { H3Event } from 'h3'

export const isPublicImageSource = (
	source: URL,
	kind: 'avatar' | 'bangumi',
): boolean => {
	if (
		source.protocol !== 'https:' ||
		source.username ||
		source.password ||
		source.port ||
		source.hash ||
		source.href.length > 2048
	)
		return false
	if (kind === 'bangumi')
		return (
			source.hostname === 'lain.bgm.tv' &&
			!source.search &&
			/^\/(?:r\/\d+\/)?pic\/cover\/[a-z]\/[a-z0-9]{2}\/[a-z0-9]{2}\/[^/]+\.(?:jpg|jpeg|png|webp|gif|avif)$/i.test(
				source.pathname,
			)
		)
	if (
		!['github.com', 'avatars.githubusercontent.com'].includes(source.hostname)
	)
		return false
	for (const [key, value] of source.searchParams) {
		if (
			!['s', 'size', 'v'].includes(key) ||
			!/^\d{1,10}$/.test(value) ||
			source.searchParams.getAll(key).length !== 1
		)
			return false
		if (
			(key === 's' || key === 'size') &&
			(Number(value) < 1 || Number(value) > 2048)
		)
			return false
	}
	return source.hostname === 'github.com'
		? /^\/[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?\.png$/i.test(source.pathname)
		: /^\/(?:u|in)\/\d+$/.test(source.pathname)
}

/** Return image bytes through this origin; never return Worker URLs or headers. */
export const servePublicImage = async (
	event: H3Event,
	kind: 'avatar' | 'bangumi',
) => {
	const value = getQuery(event).url
	let source: URL
	try {
		if (typeof value !== 'string') throw new Error('Missing image URL')
		source = new URL(value)
		if (!isPublicImageSource(source, kind))
			throw new Error('Image source is not allowed')
	} catch {
		throw createError({
			statusCode: 400,
			statusMessage: 'INVALID_IMAGE_PROXY_URL',
		})
	}
	const proxyBase = process.env.INTRO_PROXY_URL?.trim()
	let upstream = source
	if (proxyBase) {
		upstream = new URL(
			kind === 'avatar' ? '/avatar' : '/bangumi/image',
			proxyBase,
		)
		upstream.searchParams.set('url', source.href)
	}
	try {
		for (let redirects = 0; redirects <= 3; redirects++) {
			const response = await fetch(upstream, {
				redirect: 'manual',
				signal: AbortSignal.timeout(15000),
				headers: { accept: 'image/avif,image/webp,image/*' },
			})
			if ([301, 302, 303, 307, 308].includes(response.status)) {
				await response.body?.cancel()
				const location = response.headers.get('location')
				if (proxyBase || !location || redirects === 3)
					throw new Error('Image redirect is not allowed')
				upstream = new URL(location, upstream)
				if (!isPublicImageSource(upstream, kind))
					throw new Error('Image redirect target is not allowed')
				continue
			}
			const contentType = response.headers.get('content-type') || ''
			if (
				!response.ok ||
				!/^image\/(?:png|jpeg|webp|gif|avif)(?:;|$)/i.test(contentType)
			) {
				await response.body?.cancel()
				throw new Error('Image upstream response is invalid')
			}
			const image = Buffer.from(await response.arrayBuffer())
			if (image.length > 6 * 1024 * 1024)
				throw new Error('Image exceeds size limit')
			setHeader(event, 'content-type', contentType)
			setHeader(
				event,
				'cache-control',
				'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
			)
			setHeader(event, 'x-content-type-options', 'nosniff')
			const etag = response.headers.get('etag')
			if (etag) {
				setHeader(event, 'etag', etag)
				if (getHeader(event, 'if-none-match') === etag) {
					setResponseStatus(event, 304)
					return null
				}
			}
			return image
		}
	} catch {
		// Do not expose transport errors, upstream URLs, or Worker response bodies.
		throw createError({ statusCode: 502, statusMessage: 'IMAGE_PROXY_FAILED' })
	}
}
