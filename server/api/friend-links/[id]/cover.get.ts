import { readFriendLinkCoverImage } from '~/server/services/friend-link-cover.service'

export default defineEventHandler(async (event) => {
	const id = getRouterParam(event, 'id')
	const variant = getQuery(event).variant === 'mobile' ? 'mobile' : 'desktop'
	const cover = id ? await readFriendLinkCoverImage(id, variant) : null
	if (!cover)
		throw createError({
			statusCode: 404,
			statusMessage: 'FRIEND_LINK_COVER_NOT_FOUND',
		})
	setResponseHeader(event, 'Content-Type', 'image/webp')
	setResponseHeader(
		event,
		'Cache-Control',
		'public, max-age=3600, must-revalidate',
	)
	setResponseHeader(event, 'X-Content-Type-Options', 'nosniff')
	const etag = `"${variant}-${cover.capturedAt}"`
	setResponseHeader(event, 'ETag', etag)
	if (getRequestHeader(event, 'if-none-match') === etag) {
		setResponseStatus(event, 304)
		return null
	}
	return cover.bytes
})
