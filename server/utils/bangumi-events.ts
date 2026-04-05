import { EventEmitter } from 'node:events'

export const BANGUMI_EVENT_NAMES = {
	REFRESH_REQUESTED: 'bangumi.refresh.requested',
	REFRESH_RETRIED: 'bangumi.refresh.retried',
	REFRESH_SUCCEEDED: 'bangumi.refresh.succeeded',
	REFRESH_FAILED: 'bangumi.refresh.failed',
	CACHE_MISS: 'bangumi.cache.miss',
} as const

export interface BangumiRefreshRequestedEvent {
	reason: 'startup' | 'scheduled' | 'cache-miss'
	at: string
}

export interface BangumiRefreshRetriedEvent {
	reason: 'startup' | 'scheduled' | 'cache-miss'
	attempt: number
	maxAttempts: number
	errorMessage: string
	at: string
}

export interface BangumiRefreshSucceededEvent {
	reason: 'startup' | 'scheduled' | 'cache-miss'
	generatedAt: string
	nextRefreshAt: string
	anime: {
		doing: number
		wish: number
		done: number
	}
	books: {
		doing: number
		wish: number
		done: number
	}
}

export interface BangumiRefreshFailedEvent {
	reason: 'startup' | 'scheduled' | 'cache-miss'
	attempts: number
	finalErrorMessage: string
	at: string
}

export interface BangumiCacheMissEvent {
	endpoint: '/api/bangumi/anime' | '/api/bangumi/books'
	at: string
}

interface BangumiEventMap {
	[BANGUMI_EVENT_NAMES.REFRESH_REQUESTED]: BangumiRefreshRequestedEvent
	[BANGUMI_EVENT_NAMES.REFRESH_RETRIED]: BangumiRefreshRetriedEvent
	[BANGUMI_EVENT_NAMES.REFRESH_SUCCEEDED]: BangumiRefreshSucceededEvent
	[BANGUMI_EVENT_NAMES.REFRESH_FAILED]: BangumiRefreshFailedEvent
	[BANGUMI_EVENT_NAMES.CACHE_MISS]: BangumiCacheMissEvent
}

class BangumiEventBus extends EventEmitter {
	override emit<K extends keyof BangumiEventMap>(
		eventName: K,
		payload: BangumiEventMap[K],
	) {
		return super.emit(eventName, payload)
	}

	override on<K extends keyof BangumiEventMap>(
		eventName: K,
		listener: (payload: BangumiEventMap[K]) => void | Promise<void>,
	) {
		return super.on(eventName, listener)
	}
}

declare global {
	// eslint-disable-next-line no-var
	var __bangumiEventBus__: BangumiEventBus | undefined
}

export const bangumiEventBus =
	globalThis.__bangumiEventBus__ ?? new BangumiEventBus()

if (!globalThis.__bangumiEventBus__) {
	globalThis.__bangumiEventBus__ = bangumiEventBus
}
