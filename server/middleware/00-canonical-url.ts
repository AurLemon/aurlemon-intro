const NON_PAGE_PATH_PREFIXES = ['/_nuxt/', '/__', '/api/']

export default defineEventHandler((event) => {
	const requestUrl = getRequestURL(event)
	const { pathname } = requestUrl

	if (
		pathname === '/' ||
		!pathname.endsWith('/') ||
		NON_PAGE_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))
	) {
		return
	}

	const canonicalPath = pathname.replace(/\/+$/, '')
	return sendRedirect(event, `${canonicalPath}${requestUrl.search}`, 308)
})
