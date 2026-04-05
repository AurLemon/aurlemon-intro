import type { GithubContributionCalendar } from '~/shared/types/github-contributions'

type ContributionLevel =
	GithubContributionCalendar['weeks'][number]['contributionDays'][number]['contributionLevel']

const DEFAULT_DAYS = 365
const CACHE_TTL_MS = 24 * 60 * 60 * 1000
const GITHUB_COLORS = ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39']
const GITHUB_CONTRIBUTIONS_URL = 'https://github.com/users'

interface ParsedContributionDay {
	date: string
	weekday: number
	contributionLevel: ContributionLevel
	contributionCount: number
}

interface GithubContributionCacheEntry {
	expiresAt: number
	data: GithubContributionCalendar
}

interface GithubContributionInFlight {
	promise: Promise<void>
}

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
	// eslint-disable-next-line no-var
	var __githubContributionInFlight__:
		| Map<string, GithubContributionInFlight>
		| undefined
	// eslint-disable-next-line no-var
	var __githubContributionRefreshTimer__: NodeJS.Timeout | undefined
}

const githubContributionCache =
	globalThis.__githubContributionCache__ ??
	new Map<string, GithubContributionCacheEntry>()
const githubContributionInFlight =
	globalThis.__githubContributionInFlight__ ??
	new Map<string, GithubContributionInFlight>()

if (!globalThis.__githubContributionCache__) {
	globalThis.__githubContributionCache__ = githubContributionCache
}
if (!globalThis.__githubContributionInFlight__) {
	globalThis.__githubContributionInFlight__ = githubContributionInFlight
}

const buildCacheKey = (
	username: string,
	days: number,
	mode: 'recent-year' | 'days',
): string => {
	return `${username.toLowerCase()}:${mode}:${days}`
}

const toIsoDate = (value: Date): string => {
	return value.toISOString().slice(0, 10)
}

const startOfUtcDay = (value: Date): Date => {
	const d = new Date(value)
	d.setUTCHours(0, 0, 0, 0)
	return d
}

const addUtcDays = (value: Date, days: number): Date => {
	const d = new Date(value)
	d.setUTCDate(d.getUTCDate() + days)
	return d
}

const splitRangeByYear = (
	from: Date,
	to: Date,
): Array<{ fromDate: string; toDate: string }> => {
	const ranges: Array<{ fromDate: string; toDate: string }> = []
	const fromDay = startOfUtcDay(from)
	const toDay = startOfUtcDay(to)

	for (let cursor = fromDay; cursor <= toDay; cursor = addUtcDays(cursor, 1)) {
		const year = cursor.getUTCFullYear()
		const yearEnd = new Date(Date.UTC(year, 11, 31))
		const segmentEnd = yearEnd < toDay ? yearEnd : toDay
		ranges.push({
			fromDate: toIsoDate(cursor),
			toDate: toIsoDate(segmentEnd),
		})
		cursor = segmentEnd
	}

	return ranges
}

const resolveRangeFromRecentYear = (): { from: Date; to: Date } => {
	const to = new Date()
	const from = new Date(to)
	from.setUTCFullYear(from.getUTCFullYear() - 1)
	from.setUTCDate(from.getUTCDate() + 1)
	return { from, to }
}

const resolveRangeFromDays = (days: number): { from: Date; to: Date } => {
	const to = new Date()
	const from = new Date(to)
	from.setUTCDate(from.getUTCDate() - days + 1)
	return { from, to }
}

const levelToContributionLevel = (level: number): ContributionLevel => {
	const map: ContributionLevel[] = [
		'NONE',
		'FIRST_QUARTILE',
		'SECOND_QUARTILE',
		'THIRD_QUARTILE',
		'FOURTH_QUARTILE',
	]
	return map[Math.max(0, Math.min(4, level))] as ContributionLevel
}

const parseTooltipCount = (tooltip: string): number => {
	if (/no contributions/i.test(tooltip)) {
		return 0
	}

	const matched = tooltip.match(/(\d+)\s+contributions?/i)
	return matched ? Number.parseInt(matched[1] ?? '0', 10) : 0
}

const parseContributionDays = (
	html: string,
	range: { fromDate: string; toDate: string },
): ParsedContributionDay[] => {
	const tooltipCountById = new Map<string, number>()
	const tooltipReg = /<tool-tip[^>]*\bfor="([^"]+)"[^>]*>([^<]+)<\/tool-tip>/g

	for (const match of html.matchAll(tooltipReg)) {
		const id = match[1]
		const text = match[2]
		if (!id || !text) {
			continue
		}
		tooltipCountById.set(id, parseTooltipCount(text))
	}

	const days: ParsedContributionDay[] = []
	const tdReg = /<td\b[^>]*\bclass="ContributionCalendar-day"[^>]*><\/td>/g

	for (const match of html.matchAll(tdReg)) {
		const td = match[0]
		const date = td.match(/\bdata-date="(\d{4}-\d{2}-\d{2})"/)?.[1]
		const id = td.match(/\bid="(contribution-day-component-\d+-\d+)"/)?.[1]
		const level = td.match(/\bdata-level="(\d+)"/)?.[1]

		if (!date || !id || !level) {
			continue
		}
		if (date < range.fromDate || date > range.toDate) {
			continue
		}

		const weekday = new Date(`${date}T00:00:00Z`).getUTCDay()
		const levelNum = Number.parseInt(level, 10)
		days.push({
			date,
			weekday,
			contributionLevel: levelToContributionLevel(levelNum),
			contributionCount: tooltipCountById.get(id) ?? 0,
		})
	}

	return days
}

const toCalendarWeeks = (
	parsedDays: ParsedContributionDay[],
): GithubContributionCalendar['weeks'] => {
	const weekMap = new Map<string, ParsedContributionDay[]>()

	for (const day of parsedDays) {
		const date = new Date(`${day.date}T00:00:00Z`)
		const weekStart = addUtcDays(date, -date.getUTCDay())
		const weekKey = toIsoDate(weekStart)
		const list = weekMap.get(weekKey) ?? []
		list.push(day)
		weekMap.set(weekKey, list)
	}

	return [...weekMap.entries()]
		.sort((a, b) => a[0].localeCompare(b[0]))
		.map(([weekKey, days]) => {
			const contributionDays = days
				.sort((a, b) => a.weekday - b.weekday)
				.map((day) => ({
					date: day.date,
					weekday: day.weekday,
					contributionCount: day.contributionCount,
					contributionLevel: day.contributionLevel,
				}))

			return {
				firstDay: weekKey,
				contributionDays,
			}
		})
}

const createPlaceholderCalendar = (options: {
	username: string
	from: Date
	to: Date
}): GithubContributionCalendar => {
	return {
		username: options.username,
		totalContributions: 0,
		colors: GITHUB_COLORS,
		weeks: [],
		from: options.from.toISOString(),
		to: options.to.toISOString(),
		isPlaceholder: true,
	}
}

const fetchCalendarFromGithub = async (options: {
	username: string
	from: Date
	to: Date
}): Promise<GithubContributionCalendar> => {
	const segments = splitRangeByYear(options.from, options.to)
	const parsedMap = new Map<string, ParsedContributionDay>()

	for (const segment of segments) {
		const contributionsUrl =
			`${GITHUB_CONTRIBUTIONS_URL}/${encodeURIComponent(options.username)}/contributions` +
			`?from=${segment.fromDate}&to=${segment.toDate}`
		const html = await $fetch<string>(contributionsUrl, {
			headers: {
				'User-Agent': 'Mozilla/5.0',
			},
			timeout: 10_000,
			retry: 1,
		})
		const parsedDays = parseContributionDays(html, segment)
		for (const day of parsedDays) {
			parsedMap.set(day.date, day)
		}
	}
	const parsedDays = [...parsedMap.values()].sort((a, b) =>
		a.date.localeCompare(b.date),
	)

	if (!parsedDays.length) {
		throw createError({
			statusCode: 502,
			statusMessage: 'Failed to parse GitHub public contributions.',
		})
	}

	const weeks = toCalendarWeeks(parsedDays)
	const totalContributions = parsedDays.reduce(
		(sum, day) => sum + day.contributionCount,
		0,
	)

	return {
		username: options.username,
		totalContributions,
		colors: GITHUB_COLORS,
		weeks,
		from: options.from.toISOString(),
		to: options.to.toISOString(),
	}
}

const refreshGithubContributionCache = async (options: {
	cacheKey: string
	username: string
	from: Date
	to: Date
	silent?: boolean
}): Promise<void> => {
	const exists = githubContributionInFlight.get(options.cacheKey)
	if (exists) {
		return exists.promise
	}

	const promise = (async () => {
		try {
			const calendar = await fetchCalendarFromGithub({
				username: options.username,
				from: options.from,
				to: options.to,
			})
			githubContributionCache.set(options.cacheKey, {
				expiresAt: Date.now() + CACHE_TTL_MS,
				data: calendar,
			})
		} catch (error) {
			if (!options.silent) {
				console.error('[github-contributions] refresh failed', error)
			}
		} finally {
			githubContributionInFlight.delete(options.cacheKey)
		}
	})()

	githubContributionInFlight.set(options.cacheKey, { promise })
	return promise
}

export const fetchGithubContributionCalendar = async (options?: {
	username?: string
	days?: number
}): Promise<GithubContributionCalendar> => {
	const username = resolveUsername(options?.username)
	const useRecentYear = !Number.isFinite(options?.days)
	const days = useRecentYear ? DEFAULT_DAYS : clampDays(options?.days)
	const cacheKey = buildCacheKey(
		username,
		days,
		useRecentYear ? 'recent-year' : 'days',
	)
	const now = Date.now()
	const cached = githubContributionCache.get(cacheKey)
	const { from, to } = useRecentYear
		? resolveRangeFromRecentYear()
		: resolveRangeFromDays(days)

	if (cached && cached.expiresAt > now) {
		return cached.data
	}

	void refreshGithubContributionCache({
		cacheKey,
		username,
		from,
		to,
	})

	if (cached) {
		return cached.data
	}

	return createPlaceholderCalendar({
		username,
		from,
		to,
	})
}

export const warmupGithubContributionCalendar = async (options?: {
	username?: string
	days?: number
}): Promise<void> => {
	const username = resolveUsername(options?.username)
	const useRecentYear = !Number.isFinite(options?.days)
	const days = useRecentYear ? DEFAULT_DAYS : clampDays(options?.days)
	const cacheKey = buildCacheKey(
		username,
		days,
		useRecentYear ? 'recent-year' : 'days',
	)
	const { from, to } = useRecentYear
		? resolveRangeFromRecentYear()
		: resolveRangeFromDays(days)

	await refreshGithubContributionCache({
		cacheKey,
		username,
		from,
		to,
		silent: true,
	})
}

export const startGithubContributionAutoRefresh = (): void => {
	if (globalThis.__githubContributionRefreshTimer__) {
		return
	}

	void warmupGithubContributionCalendar()
	globalThis.__githubContributionRefreshTimer__ = setInterval(() => {
		void warmupGithubContributionCalendar()
	}, CACHE_TTL_MS)
}
