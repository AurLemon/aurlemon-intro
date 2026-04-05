import { existsSync, statSync } from 'node:fs'
import { isIP } from 'node:net'
import path from 'node:path'

type Ip2RegionModule = typeof import('ip2region.js')
type Searcher = import('ip2region.js').Searcher

const IPV4_DB_CANDIDATES = ['ip2region_v4.xdb', 'ip2region.xdb']
const IPV6_DB_CANDIDATES = ['ip2region_v6.xdb']

let moduleInstance: Ip2RegionModule | null = null
let initPromise: Promise<void> | null = null
const searchers = new Map<'v4' | 'v6', Searcher>()

const normalizeIpAddress = (ip: string | null | undefined): string | null => {
	if (!ip) {
		return null
	}

	const trimmed = ip.trim()
	if (!trimmed) {
		return null
	}

	const lower = trimmed.toLowerCase()
	const dottedMatch = lower.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/)
	if (dottedMatch) {
		const dottedIp = dottedMatch[1]
		if (dottedIp) {
			return dottedIp
		}
	}

	const hexMatch = lower.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/)
	if (hexMatch) {
		const highHex = hexMatch[1]
		const lowHex = hexMatch[2]
		if (!highHex || !lowHex) {
			return trimmed
		}

		const high = Number.parseInt(highHex, 16)
		const low = Number.parseInt(lowHex, 16)
		if (Number.isFinite(high) && Number.isFinite(low)) {
			const parts = [
				(high >> 8) & 0xff,
				high & 0xff,
				(low >> 8) & 0xff,
				low & 0xff,
			]
			return parts.join('.')
		}
	}

	return trimmed
}

export const detectIpVersion = (
	rawIp: string | null | undefined,
): 4 | 6 | null => {
	const normalizedIp = normalizeIpAddress(rawIp)
	if (!normalizedIp) {
		return null
	}

	const version = isIP(normalizedIp)
	return version === 4 || version === 6 ? version : null
}

const normalizeSegment = (value: string | null | undefined): string | null => {
	if (!value) {
		return null
	}
	const normalized = value.trim()
	if (!normalized || normalized === '0') {
		return null
	}
	return normalized
}

const toRegionString = (input: unknown): string | null => {
	if (typeof input === 'string') {
		return input
	}
	if (Array.isArray(input)) {
		return input
			.map((value) => (typeof value === 'string' ? value : String(value ?? '')))
			.join('|')
	}
	return null
}

const toDisplayLabel = (regionText: string): string | null => {
	const rawTokens = regionText
		.split('|')
		.map((token) => normalizeSegment(token))
		.filter((token): token is string => Boolean(token))

	if (rawTokens.length === 0) {
		return null
	}

	return rawTokens.join(' ')
}

const resolveDbPath = (version: 'v4' | 'v6'): string | null => {
	const specificEnv =
		version === 'v4'
			? process.env.IP2REGION_V4_DB_PATH
			: process.env.IP2REGION_V6_DB_PATH
	const genericEnv = process.env.IP2REGION_DB_PATH
	const fileNames = version === 'v4' ? IPV4_DB_CANDIDATES : IPV6_DB_CANDIDATES

	const candidates = new Set<string>()

	const addCandidate = (candidate: string | null | undefined) => {
		if (!candidate) {
			return
		}
		candidates.add(candidate)
	}

	addCandidate(specificEnv)
	if (genericEnv) {
		addCandidate(genericEnv)
		for (const fileName of fileNames) {
			addCandidate(path.join(genericEnv, fileName))
		}
	}

	const baseDirs = [
		process.cwd(),
		path.resolve(process.cwd(), 'data'),
		path.resolve(process.cwd(), 'data/ip2region'),
		path.resolve(process.cwd(), 'server/data'),
		path.resolve(process.cwd(), 'server/data/ip2region'),
		path.resolve(process.cwd(), '.output/server/data'),
		path.resolve(process.cwd(), '.output/server/data/ip2region'),
	]

	for (const baseDir of baseDirs) {
		for (const fileName of fileNames) {
			addCandidate(path.join(baseDir, fileName))
		}
	}

	for (const candidate of candidates) {
		if (!existsSync(candidate)) {
			continue
		}
		if (!statSync(candidate).isFile()) {
			continue
		}
		return candidate
	}

	return null
}

const createSearcher = (
	moduleRef: Ip2RegionModule,
	version: 'v4' | 'v6',
): Searcher | null => {
	const dbPath = resolveDbPath(version)
	if (!dbPath) {
		return null
	}

	try {
		const header = moduleRef.loadHeaderFromFile(dbPath)
		const detectedVersion = moduleRef.versionFromHeader(header)
		if (!detectedVersion) {
			return null
		}
		const buffer = moduleRef.loadContentFromFile(dbPath)
		return moduleRef.newWithBuffer(detectedVersion, buffer)
	} catch {
		return null
	}
}

const ensureInitialized = async () => {
	if (searchers.size > 0) {
		return
	}

	if (initPromise) {
		await initPromise
		return
	}

	initPromise = (async () => {
		moduleInstance = await import('ip2region.js')
		const v4Searcher = createSearcher(moduleInstance, 'v4')
		const v6Searcher = createSearcher(moduleInstance, 'v6')
		if (v4Searcher) {
			searchers.set('v4', v4Searcher)
		}
		if (v6Searcher) {
			searchers.set('v6', v6Searcher)
		}
	})()

	await initPromise
}

const pickSearcher = (
	moduleRef: Ip2RegionModule,
	ip: string,
): Searcher | null => {
	try {
		const parsed = moduleRef.parseIP(ip)
		const version = parsed.length === 16 ? 'v6' : 'v4'
		return searchers.get(version) ?? null
	} catch {
		return null
	}
}

export const lookupIpRegionLabel = async (
	rawIp: string | null | undefined,
): Promise<string | null> => {
	const ip = normalizeIpAddress(rawIp)
	if (!ip) {
		return null
	}

	await ensureInitialized()
	if (!moduleInstance) {
		return null
	}

	const searcher = pickSearcher(moduleInstance, ip)
	if (!searcher) {
		return null
	}

	try {
		const regionRaw = await Promise.resolve(searcher.search(ip))
		const regionText = toRegionString(regionRaw)
		if (!regionText) {
			return null
		}
		return toDisplayLabel(regionText)
	} catch {
		return null
	}
}
