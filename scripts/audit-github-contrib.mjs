#!/usr/bin/env node

const args = process.argv.slice(2)

const getArg = (name, fallback) => {
	const i = args.indexOf(`--${name}`)
	if (i >= 0 && i + 1 < args.length) {
		return args[i + 1]
	}
	return fallback
}

const user = getArg('user', 'AurLemon')
const from = getArg('from', '2025-12-01')
const to = getArg('to', '2025-12-31')
const repo = getArg('repo', 'Hydroline/hydroline-hydcraft-services')
const tz = getArg('tz', 'Asia/Shanghai')

const token = process.env.GITHUB_PAT?.trim() || process.env.GITHUB_TOKEN?.trim()

const parsePublicContributionCalendar = (html, rangeFrom, rangeTo) => {
	const map = new Map()
	const reg =
		/data-date="(\d{4}-\d{2}-\d{2})"[^>]*><\/td>\s*<tool-tip[^>]*>([^<]+)<\/tool-tip>/g

	for (const m of html.matchAll(reg)) {
		const date = m[1]
		if (date < rangeFrom || date > rangeTo) {
			continue
		}
		const tooltip = m[2]
		const count = /No contributions/i.test(tooltip)
			? 0
			: Number((tooltip.match(/(\d+) contribution/i) || [])[1] || 0)
		map.set(date, count)
	}

	return map
}

const fetchPublicContributionMap = async () => {
	const url = `https://github.com/users/${user}/contributions?from=${from}&to=${to}`
	const res = await fetch(url, {
		headers: { 'User-Agent': 'Mozilla/5.0' },
	})
	if (!res.ok) {
		throw new Error(`Failed to fetch public contributions: ${res.status}`)
	}
	const html = await res.text()
	return parsePublicContributionCalendar(html, from, to)
}

const fetchGraphqlContributionMap = async () => {
	if (!token) {
		return null
	}

	const query = `query($login:String!,$from:DateTime!,$to:DateTime!){\n  user(login:$login){\n    contributionsCollection(from:$from,to:$to){\n      restrictedContributionsCount\n      contributionCalendar{\n        totalContributions\n        weeks{contributionDays{date contributionCount}}\n      }\n    }\n  }\n}`

	const fromIso = `${from}T00:00:00Z`
	const toIso = `${to}T23:59:59Z`

	const res = await fetch('https://api.github.com/graphql', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json',
			Accept: 'application/vnd.github+json',
			'User-Agent': 'github-contrib-audit',
		},
		body: JSON.stringify({
			query,
			variables: {
				login: user,
				from: fromIso,
				to: toIso,
			},
		}),
	})

	if (!res.ok) {
		throw new Error(`GraphQL request failed: ${res.status}`)
	}

	const data = await res.json()
	if (data.errors?.length) {
		throw new Error(`GraphQL errors: ${data.errors[0].message}`)
	}

	const collection = data?.data?.user?.contributionsCollection
	const days =
		collection?.contributionCalendar?.weeks?.flatMap(
			(w) => w.contributionDays,
		) || []
	const map = new Map(days.map((d) => [d.date, d.contributionCount]))

	return {
		map,
		totalContributions:
			collection?.contributionCalendar?.totalContributions || 0,
		restrictedContributionsCount: collection?.restrictedContributionsCount || 0,
	}
}

const fetchRepoCommitMap = async () => {
	const [owner, name] = repo.split('/')
	if (!owner || !name) {
		throw new Error(`Invalid --repo: ${repo}`)
	}

	const headers = {
		Accept: 'application/vnd.github+json',
		'User-Agent': 'github-contrib-audit',
	}

	const all = []
	let page = 1

	while (true) {
		const q = `repo:${owner}/${name} author:${user} author-date:${from}..${to}`
		const url = `https://api.github.com/search/commits?q=${encodeURIComponent(q)}&per_page=100&page=${page}`
		const res = await fetch(url, { headers })
		if (!res.ok) {
			throw new Error(`Commit search failed: ${res.status}`)
		}
		const data = await res.json()
		const items = data?.items || []
		all.push(...items)

		if (items.length < 100) {
			break
		}
		page += 1
		if (page > 10) {
			break
		}
	}

	const map = new Map()
	for (const item of all) {
		const iso = item?.commit?.author?.date
		if (!iso) {
			continue
		}

		const dt = new Date(iso)
		const parts = Object.fromEntries(
			new Intl.DateTimeFormat('en-CA', {
				timeZone: tz,
				year: 'numeric',
				month: '2-digit',
				day: '2-digit',
			})
				.formatToParts(dt)
				.map((p) => [p.type, p.value]),
		)

		const day = `${parts.year}-${parts.month}-${parts.day}`
		map.set(day, (map.get(day) || 0) + 1)
	}

	return {
		map,
		total: all.length,
	}
}

const enumerateDays = (rangeFrom, rangeTo) => {
	const result = []
	const start = new Date(`${rangeFrom}T00:00:00Z`)
	const end = new Date(`${rangeTo}T00:00:00Z`)
	for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
		const day = d.toISOString().slice(0, 10)
		result.push(day)
	}
	return result
}

const sumMap = (map) => {
	let total = 0
	for (const v of map.values()) {
		total += v
	}
	return total
}

const main = async () => {
	const [publicMap, gqlData, repoData] = await Promise.all([
		fetchPublicContributionMap(),
		fetchGraphqlContributionMap(),
		fetchRepoCommitMap(),
	])

	const days = enumerateDays(from, to)
	const rows = []
	let diffDays = 0

	for (const day of days) {
		const publicCount = publicMap.get(day) || 0
		const gqlCount = gqlData?.map?.get(day) || 0
		const repoCount = repoData.map.get(day) || 0
		const delta = publicCount - gqlCount

		if (publicCount !== gqlCount) {
			diffDays += 1
		}

		if (publicCount > 0 || gqlCount > 0 || repoCount > 0) {
			rows.push({
				day,
				publicGraph: publicCount,
				graphqlToken: gqlCount,
				delta,
				repoCommits: repoCount,
			})
		}
	}

	console.log('=== GitHub Contributions Audit ===')
	console.log(
		JSON.stringify(
			{
				user,
				from,
				to,
				repo,
				timezone: tz,
				publicTotal: sumMap(publicMap),
				graphqlTotal: gqlData ? sumMap(gqlData.map) : null,
				restrictedContributionsCount: gqlData
					? gqlData.restrictedContributionsCount
					: null,
				repoCommitTotal: repoData.total,
				diffDays,
			},
			null,
			2,
		),
	)

	console.table(rows)
}

main().catch((error) => {
	console.error(error)
	process.exit(1)
})
