export interface MessageBoardPaginationQuery {
	page: number
	pageSize: number
}

const DEFAULT_PAGE = 1
const DEFAULT_PAGE_SIZE = 5
const MAX_PAGE_SIZE = 50

const toPositiveInt = (value: unknown, fallback: number) => {
	const parsed = Number(value)

	if (!Number.isFinite(parsed)) {
		return fallback
	}

	const normalized = Math.floor(parsed)
	return normalized > 0 ? normalized : fallback
}

export const parseMessageBoardPagination = (
	query: Record<string, unknown>,
): MessageBoardPaginationQuery => {
	const page = toPositiveInt(query.page, DEFAULT_PAGE)
	const pageSize = Math.min(
		MAX_PAGE_SIZE,
		toPositiveInt(query.pageSize, DEFAULT_PAGE_SIZE),
	)

	return {
		page,
		pageSize,
	}
}
