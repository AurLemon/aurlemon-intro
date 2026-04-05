import { fetchBangumiAnimeSection } from '~/server/utils/bangumi'

export default defineEventHandler(async (event) => {
	const result = await fetchBangumiAnimeSection()

	setHeader(
		event,
		'Cache-Control',
		result.isPlaceholder
			? 'no-store'
			: 'public, s-maxage=300, stale-while-revalidate=600',
	)

	return result
})
