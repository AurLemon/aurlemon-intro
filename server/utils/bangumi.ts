import type {
	BangumiCollectionType,
	BangumiCoverSet,
	BangumiSectionResponse,
	BangumiSnapshot,
	BangumiSubjectType,
	BangumiWorkItem,
} from '~/shared/types/bangumi'
import {
	BANGUMI_EVENT_NAMES,
	bangumiEventBus,
} from '~/server/utils/bangumi-events'
import {
	cleanupManagedCache,
	readManagedCache,
	refreshManagedCache,
} from '~/server/utils/memory-cache-manager'

const BANGUMI_API_BASE = 'https://api.bgm.tv/v0'
const BANGUMI_PROFILE_BASE = 'https://bgm.tv/user'
const BANGUMI_CACHE_NAMESPACE = 'bangumi'
const BANGUMI_CACHE_KEY = 'default'
const BANGUMI_CACHE_TTL_MS = 48 * 60 * 60 * 1000
const BANGUMI_MAX_CACHE_ENTRIES = 8
const COLLECTION_PAGE_LIMIT = 100
const MAX_COLLECTION_PAGES = 30

interface BangumiRawCollectionResponse {
	total: number
	limit: number
	offset: number
	data?: BangumiRawCollectionItem[]
}

interface BangumiRawCollectionItem {
	subject_id: number
	subject_type: number
	type: number
	updated_at?: string
	rate?: number
	subject?: {
		id?: number
		type?: number
		name?: string
		name_cn?: string
		date?: string
		short_summary?: string
		score?: number
		rank?: number
		eps?: number
		volumes?: number
		collection_total?: number
		images?: Partial<BangumiCoverSet>
	}
}

const resolveBangumiUsername = (): string => {
	const configured = process.env.BANGUMI_USERNAME?.trim()
	if (configured) {
		return configured
	}

	return 'AurLemon'
}

const profileUrlOf = (username: string): string => {
	return `${BANGUMI_PROFILE_BASE}/${encodeURIComponent(username)}`
}

const normalizeCover = (images?: Partial<BangumiCoverSet>): BangumiCoverSet => {
	return {
		small: images?.small ?? '',
		grid: images?.grid ?? '',
		medium: images?.medium ?? '',
		common: images?.common ?? '',
		large: images?.large ?? '',
	}
}

const resolveCoverUrl = (cover: BangumiCoverSet): string => {
	return (
		cover.common ||
		cover.medium ||
		cover.large ||
		cover.small ||
		cover.grid ||
		''
	)
}

const normalizeCollectionItem = (
	item: BangumiRawCollectionItem,
): BangumiWorkItem | null => {
	const subject = item.subject
	const subjectId = Number(subject?.id ?? item.subject_id)
	const subjectType = Number(
		subject?.type ?? item.subject_type,
	) as BangumiSubjectType
	const collectionType = Number(item.type) as BangumiCollectionType

	if (!Number.isFinite(subjectId) || (subjectType !== 1 && subjectType !== 2)) {
		return null
	}
	if (collectionType !== 1 && collectionType !== 2 && collectionType !== 3) {
		return null
	}

	const name = (subject?.name ?? '').trim()
	const nameCn = (subject?.name_cn ?? '').trim()
	const title = nameCn || name || `Subject-${subjectId}`
	const cover = normalizeCover(subject?.images)

	return {
		subjectId,
		subjectType,
		collectionType,
		updatedAt: item.updated_at ?? '',
		name: name || title,
		nameCn,
		title,
		url: `https://bgm.tv/subject/${subjectId}`,
		date: subject?.date ?? '',
		shortSummary: subject?.short_summary ?? '',
		rate: Number(item.rate ?? 0) || 0,
		score: Number(subject?.score ?? 0) || 0,
		rank: Number(subject?.rank ?? 0) || 0,
		eps: Number(subject?.eps ?? 0) || 0,
		volumes: Number(subject?.volumes ?? 0) || 0,
		collectionTotal: Number(subject?.collection_total ?? 0) || 0,
		cover,
		coverUrl: resolveCoverUrl(cover),
	}
}

const sortByRecent = (items: BangumiWorkItem[]): BangumiWorkItem[] => {
	return items.sort((a, b) => {
		if (a.updatedAt !== b.updatedAt) {
			return b.updatedAt.localeCompare(a.updatedAt)
		}
		return b.subjectId - a.subjectId
	})
}

const fetchBangumiCollectionPage = async (options: {
	username: string
	subjectType: BangumiSubjectType
	collectionType: BangumiCollectionType
	offset: number
	limit: number
}): Promise<BangumiRawCollectionResponse> => {
	const path = `/users/${encodeURIComponent(options.username)}/collections`
	return await $fetch<BangumiRawCollectionResponse>(
		`${BANGUMI_API_BASE}${path}`,
		{
			headers: {
				Accept: 'application/json',
				'User-Agent': 'AurLemonIntro/1.0',
			},
			query: {
				subject_type: options.subjectType,
				type: options.collectionType,
				limit: options.limit,
				offset: options.offset,
			},
			timeout: 12_000,
			retry: 1,
		},
	)
}

const fetchStatusGroup = async (options: {
	username: string
	subjectType: BangumiSubjectType
	collectionType: BangumiCollectionType
}): Promise<BangumiWorkItem[]> => {
	const allItems: BangumiWorkItem[] = []
	let offset = 0
	let page = 0
	let total = Number.POSITIVE_INFINITY

	while (offset < total && page < MAX_COLLECTION_PAGES) {
		const response = await fetchBangumiCollectionPage({
			username: options.username,
			subjectType: options.subjectType,
			collectionType: options.collectionType,
			offset,
			limit: COLLECTION_PAGE_LIMIT,
		})

		total = Number(response.total || 0)
		const pageItems = (response.data ?? [])
			.map(normalizeCollectionItem)
			.filter((item): item is BangumiWorkItem => item !== null)
		allItems.push(...pageItems)

		const step = Number(response.limit || COLLECTION_PAGE_LIMIT)
		if (pageItems.length === 0 || step <= 0) {
			break
		}

		offset += step
		page += 1
	}

	return sortByRecent(allItems)
}

const fetchStatusGroupSafely = async (options: {
	username: string
	subjectType: BangumiSubjectType
	collectionType: BangumiCollectionType
	label: string
}): Promise<BangumiWorkItem[]> => {
	try {
		return await fetchStatusGroup(options)
	} catch (error) {
		console.error(`[bangumi] failed to fetch group ${options.label}`, error)
		return []
	}
}

const fetchBangumiSnapshot = async (
	username: string,
): Promise<BangumiSnapshot> => {
	const [booksDoing, booksWish, booksDone, animeDoing, animeWish, animeDone] =
		await Promise.all([
			fetchStatusGroupSafely({
				username,
				subjectType: 1,
				collectionType: 3,
				label: 'books.doing',
			}),
			fetchStatusGroupSafely({
				username,
				subjectType: 1,
				collectionType: 1,
				label: 'books.wish',
			}),
			fetchStatusGroupSafely({
				username,
				subjectType: 1,
				collectionType: 2,
				label: 'books.done',
			}),
			fetchStatusGroupSafely({
				username,
				subjectType: 2,
				collectionType: 3,
				label: 'anime.doing',
			}),
			fetchStatusGroupSafely({
				username,
				subjectType: 2,
				collectionType: 1,
				label: 'anime.wish',
			}),
			fetchStatusGroupSafely({
				username,
				subjectType: 2,
				collectionType: 2,
				label: 'anime.done',
			}),
		])

	return {
		generatedAt: new Date().toISOString(),
		username,
		profileUrl: profileUrlOf(username),
		books: {
			doing: booksDoing,
			wish: booksWish,
			done: booksDone,
			wishCount: booksWish.length,
			doneCount: booksDone.length,
		},
		anime: {
			doing: animeDoing,
			wish: animeWish,
			done: animeDone,
			wishCount: animeWish.length,
			doneCount: animeDone.length,
		},
	}
}

const createEmptySnapshot = (username: string): BangumiSnapshot => {
	return {
		generatedAt: new Date().toISOString(),
		username,
		profileUrl: profileUrlOf(username),
		books: {
			doing: [],
			wish: [],
			done: [],
			wishCount: 0,
			doneCount: 0,
		},
		anime: {
			doing: [],
			wish: [],
			done: [],
			wishCount: 0,
			doneCount: 0,
		},
		isPlaceholder: true,
	}
}

const refreshBangumiSnapshot = async (options: {
	reason: 'startup' | 'scheduled' | 'cache-miss'
	silent?: boolean
}): Promise<void> => {
	const username = resolveBangumiUsername()
	bangumiEventBus.emit(BANGUMI_EVENT_NAMES.REFRESH_REQUESTED, {
		reason: options.reason,
		at: new Date().toISOString(),
	})

	await refreshManagedCache({
		namespace: BANGUMI_CACHE_NAMESPACE,
		key: BANGUMI_CACHE_KEY,
		loader: async () => await fetchBangumiSnapshot(username),
		ttlMs: BANGUMI_CACHE_TTL_MS,
		silent: options.silent,
		maxEntries: BANGUMI_MAX_CACHE_ENTRIES,
	})

	const cached = readManagedCache<BangumiSnapshot>({
		namespace: BANGUMI_CACHE_NAMESPACE,
		key: BANGUMI_CACHE_KEY,
	})
	if (!cached.entry) {
		return
	}

	const data = cached.entry.data
	bangumiEventBus.emit(BANGUMI_EVENT_NAMES.REFRESH_SUCCEEDED, {
		reason: options.reason,
		generatedAt: data.generatedAt,
		nextRefreshAt: new Date(Date.now() + BANGUMI_CACHE_TTL_MS).toISOString(),
		anime: {
			doing: data.anime.doing.length,
			wish: data.anime.wish.length,
			done: data.anime.done.length,
		},
		books: {
			doing: data.books.doing.length,
			wish: data.books.wish.length,
			done: data.books.done.length,
		},
	})
}

const refreshBangumiSnapshotWithRetry = async (options: {
	reason: 'startup' | 'scheduled' | 'cache-miss'
	maxAttempts: number
	silent?: boolean
}): Promise<boolean> => {
	let lastError: unknown = null

	for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
		try {
			await refreshBangumiSnapshot({
				reason: options.reason,
				silent: options.silent,
			})
			return true
		} catch (error) {
			lastError = error
			if (attempt < options.maxAttempts) {
				bangumiEventBus.emit(BANGUMI_EVENT_NAMES.REFRESH_RETRIED, {
					reason: options.reason,
					attempt,
					maxAttempts: options.maxAttempts,
					errorMessage: error instanceof Error ? error.message : String(error),
					at: new Date().toISOString(),
				})
			}
		}
	}

	bangumiEventBus.emit(BANGUMI_EVENT_NAMES.REFRESH_FAILED, {
		reason: options.reason,
		attempts: options.maxAttempts,
		finalErrorMessage:
			lastError instanceof Error ? lastError.message : String(lastError),
		at: new Date().toISOString(),
	})
	if (!options.silent) {
		console.error('[bangumi] refresh failed after retries', lastError)
	}
	return false
}

const snapshotToSection = (
	snapshot: BangumiSnapshot,
	type: 'anime' | 'books',
): BangumiSectionResponse => {
	const group = snapshot[type]
	return {
		type,
		generatedAt: snapshot.generatedAt,
		username: snapshot.username,
		profileUrl: snapshot.profileUrl,
		wishCount: group.wishCount,
		doneCount: group.doneCount,
		items: [...group.doing, ...group.wish, ...group.done],
		isPlaceholder: snapshot.isPlaceholder,
	}
}

const resolveBangumiSection = async (options: {
	type: 'anime' | 'books'
	endpoint: '/api/bangumi/anime' | '/api/bangumi/books'
}): Promise<BangumiSectionResponse> => {
	const now = Date.now()
	cleanupManagedCache({
		namespace: BANGUMI_CACHE_NAMESPACE,
		now,
		keepKey: BANGUMI_CACHE_KEY,
		maxEntries: BANGUMI_MAX_CACHE_ENTRIES,
	})

	const cached = readManagedCache<BangumiSnapshot>({
		namespace: BANGUMI_CACHE_NAMESPACE,
		key: BANGUMI_CACHE_KEY,
		now,
	})

	if (cached.isFresh && cached.entry) {
		return snapshotToSection(cached.entry.data, options.type)
	}

	if (cached.entry) {
		void refreshBangumiSnapshotWithRetry({
			reason: 'scheduled',
			maxAttempts: 1,
			silent: true,
		})
		return snapshotToSection(cached.entry.data, options.type)
	}

	bangumiEventBus.emit(BANGUMI_EVENT_NAMES.CACHE_MISS, {
		endpoint: options.endpoint,
		at: new Date().toISOString(),
	})

	const loaded = await refreshBangumiSnapshotWithRetry({
		reason: 'cache-miss',
		maxAttempts: 1,
		silent: true,
	})

	if (loaded) {
		const afterLoad = readManagedCache<BangumiSnapshot>({
			namespace: BANGUMI_CACHE_NAMESPACE,
			key: BANGUMI_CACHE_KEY,
		})
		if (afterLoad.entry) {
			return snapshotToSection(afterLoad.entry.data, options.type)
		}
	}

	return snapshotToSection(
		createEmptySnapshot(resolveBangumiUsername()),
		options.type,
	)
}

export const fetchBangumiAnimeSection =
	async (): Promise<BangumiSectionResponse> => {
		return await resolveBangumiSection({
			type: 'anime',
			endpoint: '/api/bangumi/anime',
		})
	}

export const fetchBangumiBooksSection =
	async (): Promise<BangumiSectionResponse> => {
		return await resolveBangumiSection({
			type: 'books',
			endpoint: '/api/bangumi/books',
		})
	}

export const warmupBangumiSnapshot = async (): Promise<void> => {
	await refreshBangumiSnapshotWithRetry({
		reason: 'startup',
		maxAttempts: 3,
		silent: true,
	})
}

declare global {
	var __bangumiRefreshTimer__: NodeJS.Timeout | undefined
}

export const startBangumiAutoRefresh = (): void => {
	if (globalThis.__bangumiRefreshTimer__) {
		return
	}

	void warmupBangumiSnapshot()
	globalThis.__bangumiRefreshTimer__ = setInterval(() => {
		void refreshBangumiSnapshotWithRetry({
			reason: 'scheduled',
			maxAttempts: 1,
			silent: true,
		})
	}, BANGUMI_CACHE_TTL_MS)
}
