import type {
	MessageBoardPinFilter,
	MessageBoardSortOrder,
} from '~/shared/types/social'

export interface MessageBoardPaginationQuery {
	page: number
	pageSize: number
	sort: MessageBoardSortOrder
	pinFilter: MessageBoardPinFilter
}

const DEFAULT_PAGE = 1
const DEFAULT_PAGE_SIZE = 5
const MAX_PAGE_SIZE = 50
const DEFAULT_SORT: MessageBoardSortOrder = 'latest'
const DEFAULT_PIN_FILTER: MessageBoardPinFilter = 'all'

const readQueryString = (value: unknown): string | null => {
	if (Array.isArray(value)) {
		const first = value[0]
		return typeof first === 'string' ? first : null
	}

	return typeof value === 'string' ? value : null
}

const toPositiveInt = (value: unknown, fallback: number) => {
	const normalizedValue = Array.isArray(value) ? value[0] : value
	const parsed = Number(normalizedValue)

	if (!Number.isFinite(parsed)) {
		return fallback
	}

	const normalized = Math.floor(parsed)
	return normalized > 0 ? normalized : fallback
}

const parseSortOrder = (
	query: Record<string, unknown>,
): MessageBoardSortOrder => {
	const rawSort = (
		readQueryString(query.sort) ??
		readQueryString(query.order) ??
		''
	)
		.trim()
		.toLowerCase()

	if (rawSort === 'earliest' || rawSort === 'oldest' || rawSort === 'asc') {
		return 'earliest'
	}

	if (rawSort === 'latest' || rawSort === 'newest' || rawSort === 'desc') {
		return 'latest'
	}

	return DEFAULT_SORT
}

const parsePinFilter = (
	query: Record<string, unknown>,
): MessageBoardPinFilter => {
	const rawPinFilter = readQueryString(query.pinFilter)?.trim().toLowerCase()

	if (rawPinFilter === 'pinned') {
		return 'pinned'
	}

	if (rawPinFilter === 'unpinned') {
		return 'unpinned'
	}

	if (rawPinFilter === 'all') {
		return 'all'
	}

	const rawPinned = readQueryString(query.pinned)?.trim().toLowerCase()

	if (
		rawPinned === 'true' ||
		rawPinned === '1' ||
		rawPinned === 'yes' ||
		rawPinned === 'only' ||
		rawPinned === 'pinned'
	) {
		return 'pinned'
	}

	if (
		rawPinned === 'false' ||
		rawPinned === '0' ||
		rawPinned === 'no' ||
		rawPinned === 'exclude' ||
		rawPinned === 'unpinned'
	) {
		return 'unpinned'
	}

	return DEFAULT_PIN_FILTER
}

export const parseMessageBoardPagination = (
	query: Record<string, unknown>,
): MessageBoardPaginationQuery => {
	const page = toPositiveInt(query.page, DEFAULT_PAGE)
	const pageSize = Math.min(
		MAX_PAGE_SIZE,
		toPositiveInt(query.pageSize, DEFAULT_PAGE_SIZE),
	)
	const sort = parseSortOrder(query)
	const pinFilter = parsePinFilter(query)

	return {
		page,
		pageSize,
		sort,
		pinFilter,
	}
}
