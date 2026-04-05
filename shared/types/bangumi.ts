export type BangumiSubjectType = 1 | 2
export type BangumiCollectionType = 1 | 2 | 3

export interface BangumiCoverSet {
	small: string
	grid: string
	medium: string
	common: string
	large: string
}

export interface BangumiWorkItem {
	subjectId: number
	subjectType: BangumiSubjectType
	collectionType: BangumiCollectionType
	updatedAt: string
	name: string
	nameCn: string
	title: string
	url: string
	date: string
	shortSummary: string
	rate: number
	score: number
	rank: number
	eps: number
	volumes: number
	collectionTotal: number
	cover: BangumiCoverSet
	coverUrl: string
}

export interface BangumiGroupedWorks {
	doing: BangumiWorkItem[]
	wish: BangumiWorkItem[]
	done: BangumiWorkItem[]
	wishCount: number
	doneCount: number
}

export interface BangumiSnapshot {
	generatedAt: string
	username: string
	profileUrl: string
	books: BangumiGroupedWorks
	anime: BangumiGroupedWorks
	isPlaceholder?: boolean
}

export interface BangumiSectionResponse {
	type: 'anime' | 'books'
	generatedAt: string
	username: string
	profileUrl: string
	wishCount: number
	doneCount: number
	items: BangumiWorkItem[]
	isPlaceholder?: boolean
}
