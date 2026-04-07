import { EventEmitter } from 'node:events'

export const GITHUB_CONTRIBUTIONS_EVENT_NAMES = {
	REFRESH_REQUESTED: 'github-contributions.refresh.requested',
	REFRESH_SUCCEEDED: 'github-contributions.refresh.succeeded',
	REFRESH_FAILED: 'github-contributions.refresh.failed',
} as const

export interface GithubContributionsRefreshRequestedEvent {
	username: string
	reason: 'startup' | 'scheduled' | 'cache-miss'
	transport: 'proxy' | 'direct'
	at: string
}

export interface GithubContributionsRefreshSucceededEvent {
	username: string
	reason: 'startup' | 'scheduled' | 'cache-miss'
	transport: 'proxy' | 'direct'
	from: string
	to: string
	totalContributions: number
	weeks: number
	durationMs: number
	at: string
}

export interface GithubContributionsRefreshFailedEvent {
	username: string
	reason: 'startup' | 'scheduled' | 'cache-miss'
	transport: 'proxy' | 'direct'
	from: string
	to: string
	errorMessage: string
	durationMs: number
	at: string
}

interface GithubContributionsEventMap {
	[GITHUB_CONTRIBUTIONS_EVENT_NAMES.REFRESH_REQUESTED]: GithubContributionsRefreshRequestedEvent
	[GITHUB_CONTRIBUTIONS_EVENT_NAMES.REFRESH_SUCCEEDED]: GithubContributionsRefreshSucceededEvent
	[GITHUB_CONTRIBUTIONS_EVENT_NAMES.REFRESH_FAILED]: GithubContributionsRefreshFailedEvent
}

class GithubContributionsEventBus extends EventEmitter {
	override emit<K extends keyof GithubContributionsEventMap>(
		eventName: K,
		payload: GithubContributionsEventMap[K],
	) {
		return super.emit(eventName, payload)
	}

	override on<K extends keyof GithubContributionsEventMap>(
		eventName: K,
		listener: (payload: GithubContributionsEventMap[K]) => void | Promise<void>,
	) {
		return super.on(eventName, listener)
	}
}

declare global {
	var __githubContributionsEventBus__: GithubContributionsEventBus | undefined
}

export const githubContributionsEventBus =
	globalThis.__githubContributionsEventBus__ ??
	new GithubContributionsEventBus()

if (!globalThis.__githubContributionsEventBus__) {
	globalThis.__githubContributionsEventBus__ = githubContributionsEventBus
}
