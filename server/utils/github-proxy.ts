import { createError } from 'h3'

const TRUE_ENV_VALUES = new Set(['1', 'true', 'yes', 'on'])
const DEFAULT_PROXY_TIMEOUT_MS = 14_000

type GithubProxyRequestBodyType = 'raw' | 'json' | 'base64'

export type GithubProxyResponseBodyType = 'json' | 'text' | 'binary' | 'empty'

export interface GithubProxyEnvelope {
	ok: boolean
	status: number
	headers?: Record<string, string>
	bodyType: GithubProxyResponseBodyType
	body: string | null
	error?: string
	requestId?: string
	durationMs?: number
}

interface GithubProxyRequestPayload {
	url: string
	method?: string
	headers?: Record<string, string>
	bodyType?: GithubProxyRequestBodyType
	body?: unknown
	timeoutMs?: number
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
	return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

const parseBooleanEnv = (value: string | undefined): boolean => {
	if (!value) {
		return false
	}

	return TRUE_ENV_VALUES.has(value.trim().toLowerCase())
}

const resolveProxyConfig = (): { url: string; handshakeKey: string } => {
	return {
		url: (process.env.GITHUB_PROXY_URL ?? '').trim(),
		handshakeKey: (process.env.GITHUB_PROXY_HANDSHAKE_KEY ?? '').trim(),
	}
}

const normalizeProxyTimeout = (timeoutMs?: number): number => {
	if (!Number.isFinite(timeoutMs)) {
		return DEFAULT_PROXY_TIMEOUT_MS
	}

	const parsed = Math.floor(timeoutMs as number)

	if (parsed < 1_000) {
		return 1_000
	}

	if (parsed > 25_000) {
		return 25_000
	}

	return parsed
}

const normalizeEnvelope = (value: unknown): GithubProxyEnvelope => {
	if (!isRecord(value)) {
		throw new Error('GitHub proxy returned invalid envelope.')
	}

	const ok = value.ok
	const status = value.status
	const bodyType = value.bodyType
	const body = value.body

	if (typeof ok !== 'boolean') {
		throw new Error('GitHub proxy envelope is missing ok flag.')
	}

	if (typeof status !== 'number' || !Number.isFinite(status)) {
		throw new Error('GitHub proxy envelope is missing status code.')
	}

	if (
		bodyType !== 'json' &&
		bodyType !== 'text' &&
		bodyType !== 'binary' &&
		bodyType !== 'empty'
	) {
		throw new Error('GitHub proxy envelope has unsupported bodyType.')
	}

	if (body !== null && typeof body !== 'string') {
		throw new Error('GitHub proxy envelope has unsupported body payload.')
	}

	const headers = isRecord(value.headers)
		? Object.fromEntries(
				Object.entries(value.headers)
					.filter(
						([key, headerValue]) =>
							typeof key === 'string' && typeof headerValue === 'string',
					)
					.map(([key, headerValue]) => [key, headerValue as string]),
			)
		: undefined

	return {
		ok,
		status,
		headers,
		bodyType,
		body,
		error: typeof value.error === 'string' ? value.error : undefined,
		requestId:
			typeof value.requestId === 'string' ? value.requestId : undefined,
		durationMs:
			typeof value.durationMs === 'number' && Number.isFinite(value.durationMs)
				? value.durationMs
				: undefined,
	}
}

export const isGithubProxyEnabled = (): boolean => {
	return parseBooleanEnv(process.env.GITHUB_PROXY_ENABLED)
}

export const proxyGithubRequest = async (
	payload: GithubProxyRequestPayload,
): Promise<GithubProxyEnvelope> => {
	const { url, handshakeKey } = resolveProxyConfig()

	if (!url || !handshakeKey) {
		throw createError({
			statusCode: 500,
			statusMessage: 'GITHUB_OAUTH_NOT_CONFIGURED',
		})
	}

	const response = await $fetch<unknown>(url, {
		method: 'POST',
		retry: 0,
		ignoreResponseError: true,
		timeout: normalizeProxyTimeout(payload.timeoutMs),
		body: {
			key: handshakeKey,
			url: payload.url,
			method: payload.method,
			headers: payload.headers,
			bodyType: payload.bodyType,
			body: payload.body,
			timeoutMs: payload.timeoutMs,
		},
	})

	return normalizeEnvelope(response)
}

export const isGithubProxyTransportError = (
	envelope: GithubProxyEnvelope,
): boolean => {
	if (envelope.ok) {
		return false
	}

	if (envelope.status === 502 || envelope.status === 504) {
		const errorMessage = (envelope.error ?? '').toLowerCase()
		return (
			errorMessage.includes('timeout') ||
			errorMessage.includes('request failed') ||
			errorMessage.includes('failed to read upstream')
		)
	}

	return false
}

export const resolveGithubProxyBodyText = (
	envelope: GithubProxyEnvelope,
): string => {
	if (typeof envelope.body === 'string') {
		return envelope.body
	}

	return ''
}

export const resolveGithubProxyJsonBody = <T>(
	envelope: GithubProxyEnvelope,
): T => {
	const raw = resolveGithubProxyBodyText(envelope)

	if (!raw) {
		throw new Error('GitHub proxy response body is empty.')
	}

	try {
		return JSON.parse(raw) as T
	} catch {
		throw new Error('GitHub proxy response body is not valid JSON.')
	}
}
