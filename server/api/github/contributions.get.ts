import { fetchGithubContributionCalendar } from '~/server/utils/github-contributions'

const GITHUB_LOGIN_PATTERN = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i

const parseOptionalPositiveInt = (value: unknown): number | undefined => {
	if (typeof value !== 'string') {
		return undefined
	}

	const parsed = Number.parseInt(value, 10)
	return Number.isFinite(parsed) ? parsed : undefined
}

export default defineEventHandler(async (event) => {
	const { username, days } = getQuery(event)

	if (typeof username === 'string' && !GITHUB_LOGIN_PATTERN.test(username)) {
		throw createError({
			statusCode: 400,
			statusMessage: 'Invalid GitHub username.',
		})
	}

	setHeader(
		event,
		'Cache-Control',
		'public, s-maxage=300, stale-while-revalidate=600',
	)

	return fetchGithubContributionCalendar({
		username: typeof username === 'string' ? username : undefined,
		days: parseOptionalPositiveInt(days),
	})
})
