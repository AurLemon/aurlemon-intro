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

interface OAuthProgressRecord extends OAuthProgressSnapshot {
	updatedAt: number
	code: string
	state: string
	localePrefix: string
	processing: boolean
	redirectPath?: string
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
	const record = progressRecords.get(traceId) ?? {
		updates: [],
		completed: false,
		status: 'processing' as const,
		updatedAt: now,
		code: '',
		state: '',
		localePrefix: '',
		processing: true,
	}
	record.updates.push(update)
	record.updatedAt = now
	progressRecords.set(traceId, record)
}

export const completeOAuthProgress = (traceId: string): void => {
	const now = Date.now()
	pruneExpiredRecords(now)
	const record = progressRecords.get(traceId) ?? {
		updates: [],
		completed: false,
		status: 'processing' as const,
		updatedAt: now,
		code: '',
		state: '',
		localePrefix: '',
		processing: true,
	}
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
): void => {
	const record = progressRecords.get(traceId)
	if (!record) return
	record.redirectPath = redirectPath
	record.updatedAt = Date.now()
	progressRecords.set(traceId, record)
}

export const getOAuthProgressRedirectPath = (
	traceId: string,
): string | undefined => {
	pruneExpiredRecords(Date.now())
	return progressRecords.get(traceId)?.redirectPath
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
