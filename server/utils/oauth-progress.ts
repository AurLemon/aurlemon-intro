import type { OAuthProviderName } from '~/shared/types/social'

export type OAuthProgressKey =
	| 'received'
	| 'validating'
	| 'stateVerified'
	| 'tokenStarted'
	| 'tokenCompleted'
	| 'profileStarted'
	| 'profileCompleted'
	| 'emailsStarted'
	| 'emailsCompleted'
	| 'retrying'
	| 'accountStarted'
	| 'accountCompleted'
	| 'redirecting'
	| 'failed'

export interface OAuthProgressUpdate {
	key: OAuthProgressKey
	attempt?: number
	totalAttempts?: number
}

export interface OAuthProgressSnapshot {
	updates: OAuthProgressUpdate[]
	completed: boolean
	status: 'pending' | 'processing' | 'completed' | 'failed'
	errorCode?: string
}

interface OAuthProgressResult {
	redirectPath?: string
	sessionCookies?: string[]
}

interface OAuthProgressRecord
	extends OAuthProgressSnapshot, OAuthProgressResult {
	updatedAt: number
	code: string
	state: string
	localePrefix: string
	processing: boolean
	browserSecretHash: string
	provider: OAuthProviderName
}

const PROGRESS_TTL_MS = 5 * 60 * 1000
const MAX_PROGRESS_RECORDS = 1024
const progressRecords = new Map<string, OAuthProgressRecord>()

const pruneExpiredRecords = (now: number): void => {
	for (const [traceId, record] of progressRecords) {
		if (now - record.updatedAt > PROGRESS_TTL_MS) {
			progressRecords.delete(traceId)
		}
	}
	while (progressRecords.size >= MAX_PROGRESS_RECORDS) {
		const oldestTraceId = progressRecords.keys().next().value
		if (!oldestTraceId) break
		progressRecords.delete(oldestTraceId)
	}
}

export const startOAuthProgress = (
	traceId: string,
	code: string,
	state: string,
	localePrefix: string,
	browserSecretHash: string,
	provider: OAuthProviderName,
): void => {
	const now = Date.now()
	pruneExpiredRecords(now)
	progressRecords.set(traceId, {
		updates: [{ key: 'received' }],
		completed: false,
		status: 'pending',
		updatedAt: now,
		code,
		state,
		localePrefix,
		browserSecretHash,
		provider,
		processing: false,
	})
}

export const beginOAuthProgress = (
	traceId: string,
): {
	shouldStart: boolean
	code: string
	state: string
	localePrefix: string
} | null => {
	pruneExpiredRecords(Date.now())
	const record = progressRecords.get(traceId)
	if (!record) return null
	if (record.status !== 'pending' || record.processing) {
		return {
			shouldStart: false,
			code: record.code,
			state: record.state,
			localePrefix: record.localePrefix,
		}
	}
	record.processing = true
	record.status = 'processing'
	record.updatedAt = Date.now()
	const credentials = { code: record.code, state: record.state }
	record.code = ''
	record.state = ''
	progressRecords.set(traceId, record)
	return {
		shouldStart: true,
		...credentials,
		localePrefix: record.localePrefix,
	}
}

export const updateOAuthProgress = (
	traceId: string,
	update: OAuthProgressUpdate,
): void => {
	const now = Date.now()
	pruneExpiredRecords(now)
	const record = progressRecords.get(traceId)
	if (!record) return
	record.updates.push(update)
	record.updatedAt = now
	progressRecords.set(traceId, record)
}

export const completeOAuthProgress = (traceId: string): void => {
	const now = Date.now()
	pruneExpiredRecords(now)
	const record = progressRecords.get(traceId)
	if (!record) return
	record.completed = true
	record.status = 'completed'
	record.processing = false
	record.updatedAt = now
	progressRecords.set(traceId, record)
}

export const failOAuthProgress = (traceId: string, errorCode: string): void => {
	const record = progressRecords.get(traceId)
	if (!record) return
	record.status = 'failed'
	record.errorCode = errorCode
	record.processing = false
	record.updatedAt = Date.now()
	progressRecords.set(traceId, record)
}

export const finishOAuthProgress = (
	traceId: string,
	redirectPath: string,
	sessionCookies?: string[],
): void => {
	const record = progressRecords.get(traceId)
	if (!record) return
	record.redirectPath = redirectPath
	record.sessionCookies = sessionCookies
	record.updatedAt = Date.now()
	progressRecords.set(traceId, record)
}

export const getOAuthProgressResult = (
	traceId: string,
): OAuthProgressResult => {
	pruneExpiredRecords(Date.now())
	const record = progressRecords.get(traceId)
	return {
		redirectPath: record?.redirectPath,
		sessionCookies: record?.sessionCookies,
	}
}

export const getOAuthFlowCookieName = (traceId: string): string =>
	`aurlemon_oauth_${traceId}`

export const verifyOAuthProgressBrowser = (
	traceId: string,
	browserSecretHash: string,
	provider: OAuthProviderName,
): boolean => {
	pruneExpiredRecords(Date.now())
	return Boolean(
		browserSecretHash &&
		progressRecords.get(traceId)?.browserSecretHash === browserSecretHash &&
		progressRecords.get(traceId)?.provider === provider,
	)
}

export const getOAuthProgress = (traceId: string): OAuthProgressSnapshot => {
	pruneExpiredRecords(Date.now())
	const record = progressRecords.get(traceId)
	return record
		? {
				updates: [...record.updates],
				completed: record.completed,
				status: record.status,
				errorCode: record.errorCode,
			}
		: {
				updates: [],
				completed: false,
				status: 'failed',
				errorCode: 'OAUTH_PROGRESS_NOT_FOUND',
			}
}
