import type { GithubContributionCalendar } from '~/shared/types/github-contributions'

interface GithubGraphQLResponse {
	data?: {
		user?: {
			login: string
			contributionsCollection?: {
				contributionCalendar?: {
					totalContributions: number
					colors: string[]
					weeks: GithubContributionCalendar['weeks']
				}
			}
		}
	}
	errors?: Array<{ message: string }>
}

const GITHUB_GRAPHQL_URL = 'https://api.github.com/graphql'
const DEFAULT_DAYS = 365
const CACHE_TTL_MS = 24 * 60 * 60 * 1000

interface GithubContributionCacheEntry {
	expiresAt: number
	data: GithubContributionCalendar
}

const CONTRIBUTIONS_QUERY = `
query ($login: String!, $from: DateTime!, $to: DateTime!) {
  user(login: $login) {
    login
    contributionsCollection(from: $from, to: $to) {
      contributionCalendar {
        totalContributions
        colors
        weeks {
          firstDay
          contributionDays {
            contributionCount
            contributionLevel
            date
            weekday
          }
        }
      }
    }
  }
}
`

const resolveUsername = (explicitUsername?: string): string => {
	if (explicitUsername) {
		return explicitUsername
	}

	const configured = process.env.GITHUB_CONTRIBUTIONS_USERNAME?.trim()
	if (configured) {
		return configured
	}

	return (process.env.ADMIN_GITHUB_IDS ?? 'AurLemon')
		.split(',')
		.map((item) => item.trim())
		.filter(Boolean)[0] as string
}

const clampDays = (days?: number): number => {
	if (!Number.isFinite(days)) {
		return DEFAULT_DAYS
	}

	return Math.min(365, Math.max(30, Math.floor(days as number)))
}

declare global {
	// eslint-disable-next-line no-var
	var __githubContributionCache__:
		| Map<string, GithubContributionCacheEntry>
		| undefined
}

const githubContributionCache =
	globalThis.__githubContributionCache__ ??
	new Map<string, GithubContributionCacheEntry>()

if (!globalThis.__githubContributionCache__) {
	globalThis.__githubContributionCache__ = githubContributionCache
}

const buildCacheKey = (username: string, days: number): string => {
	return `${username.toLowerCase()}:${days}`
}

export const fetchGithubContributionCalendar = async (options?: {
	username?: string
	days?: number
}): Promise<GithubContributionCalendar> => {
	const token =
		process.env.GITHUB_PAT?.trim() ?? process.env.GITHUB_TOKEN?.trim()

	if (!token) {
		throw createError({
			statusCode: 500,
			statusMessage: 'GITHUB_PAT is not configured.',
		})
	}

	const username = resolveUsername(options?.username)
	const days = clampDays(options?.days)
	const cacheKey = buildCacheKey(username, days)
	const now = Date.now()
	const cached = githubContributionCache.get(cacheKey)

	if (cached && cached.expiresAt > now) {
		return cached.data
	}

	if (cached && cached.expiresAt <= now) {
		githubContributionCache.delete(cacheKey)
	}

	const to = new Date()
	const from = new Date()
	from.setUTCDate(from.getUTCDate() - days + 1)

	const payload = await $fetch<GithubGraphQLResponse>(GITHUB_GRAPHQL_URL, {
		method: 'POST',
		headers: {
			authorization: `Bearer ${token}`,
			accept: 'application/vnd.github+json',
			'user-agent': 'AurLemon-Intro',
			'x-github-api-version': '2022-11-28',
		},
		body: {
			query: CONTRIBUTIONS_QUERY,
			variables: {
				login: username,
				from: from.toISOString(),
				to: to.toISOString(),
			},
		},
	})

	if (payload.errors?.length) {
		throw createError({
			statusCode: 502,
			statusMessage:
				payload.errors[0]?.message ?? 'GitHub GraphQL request failed.',
		})
	}

	const user = payload.data?.user
	const calendar = user?.contributionsCollection?.contributionCalendar

	if (!user?.login || !calendar) {
		throw createError({
			statusCode: 404,
			statusMessage: 'GitHub user or contribution calendar not found.',
		})
	}

	const result: GithubContributionCalendar = {
		username: user.login,
		totalContributions: calendar.totalContributions,
		colors: calendar.colors,
		weeks: calendar.weeks,
		from: from.toISOString(),
		to: to.toISOString(),
	}

	githubContributionCache.set(cacheKey, {
		expiresAt: now + CACHE_TTL_MS,
		data: result,
	})

	return result
}
