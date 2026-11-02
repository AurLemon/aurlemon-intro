import { createError } from 'h3'
import { randomUUID } from 'node:crypto'

const TRUE_ENV_VALUES = new Set(['1', 'true', 'yes', 'on'])
const DEFAULT_PROXY_TIMEOUT_MS = 14_000

type IntroProxyRequestBodyType = 'raw' | 'json' | 'base64'

export type IntroProxyResponseBodyType = 'json' | 'text' | 'binary' | 'empty'

export interface IntroProxyEnvelope {
	ok: boolean
	status: number
	outerStatus?: number
	workerRequestId?: string
	headers?: Record<string, string>
	bodyType: IntroProxyResponseBodyType
	body: string | null
	error?: string
	requestId?: string
	durationMs?: number
}

interface IntroProxyRequestPayload {
	traceId?: string
	url: string
	method?: string
	headers?: Record<string, string>
	bodyType?: IntroProxyRequestBodyType
	body?: unknown
	timeoutMs?: number
	notConfiguredStatusMessage?: string
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

const sanitizeProxyUrlForLog = (value: string): string => {
	try {
		const parsed = new URL(value)
		return `${parsed.origin}${parsed.pathname}`
	} catch {
		return 'INVALID_URL'
	}
}

const resolveProxyUrl = (): string => {
	return (process.env.INTRO_PROXY_URL ?? '').trim()
}

const resolveProxyConfig = (): { url: string; handshakeKey: string } => {
	return {
		url: resolveProxyUrl(),
		handshakeKey: (process.env.INTRO_PROXY_HANDSHAKE_KEY ?? '').trim(),
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

const normalizeEnvelope = (value: unknown): IntroProxyEnvelope => {
	if (!isRecord(value)) {
		throw new Error('Intro proxy returned invalid envelope.')
	}

	const ok = value.ok
	const status = value.status
	const bodyType = value.bodyType
	const body = value.body

	if (typeof ok !== 'boolean') {
		throw new Error('Intro proxy envelope is missing ok flag.')
	}

	if (typeof status !== 'number' || !Number.isFinite(status)) {
		throw new Error('Intro proxy envelope is missing status code.')
	}

	if (
		bodyType !== 'json' &&
		bodyType !== 'text' &&
		bodyType !== 'binary' &&
		bodyType !== 'empty'
	) {
		throw new Error('Intro proxy envelope has unsupported bodyType.')
	}

	if (body !== null && typeof body !== 'string') {
		throw new Error('Intro proxy envelope has unsupported body payload.')
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

export const isBangumiProxyEnabled = (): boolean => {
	return parseBooleanEnv(process.env.BANGUMI_PROXY_ENABLED)
}

export const isLinuxDoProxyEnabled = (): boolean => {
	return parseBooleanEnv(process.env.LINUX_DO_PROXY_ENABLED)
}

export interface IntroProxyLogMeta {
	introProxyConfigured: boolean
	introProxyUrl: string | null
	githubProxyEnabled: boolean
	bangumiProxyEnabled: boolean
	linuxDoProxyEnabled: boolean
}

export const getIntroProxyLogMeta = (): IntroProxyLogMeta => {
	const { url, handshakeKey } = resolveProxyConfig()

	return {
		introProxyConfigured: Boolean(url && handshakeKey),
		introProxyUrl: url ? sanitizeProxyUrlForLog(url) : null,
		githubProxyEnabled: isGithubProxyEnabled(),
		bangumiProxyEnabled: isBangumiProxyEnabled(),
		linuxDoProxyEnabled: isLinuxDoProxyEnabled(),
	}
}

export const proxyIntroRequest = async (
	payload: IntroProxyRequestPayload,
): Promise<IntroProxyEnvelope> => {
	const { url, handshakeKey } = resolveProxyConfig()

	if (!url || !handshakeKey) {
		throw createError({
			statusCode: 500,
			statusMessage:
				payload.notConfiguredStatusMessage ?? 'INTRO_PROXY_NOT_CONFIGURED',
		})
	}

	const requestId = randomUUID()
	const startedAt = performance.now()
	const meta: Record<string, unknown> = {
		requestId,
		traceId: payload.traceId,
		proxyUrl: sanitizeProxyUrlForLog(url),
		upstreamHost: new URL(payload.url).hostname,
		method: payload.method ?? 'GET',
		timeoutMs: normalizeProxyTimeout(payload.timeoutMs),
	}
	const verbose = parseBooleanEnv(process.env.INTRO_PROXY_DIAGNOSTICS)
	if (verbose) console.info('INTRO_PROXY_REQUEST_STARTED', meta)
	let phase = 'transport'
	try {
		const response = await $fetch.raw<string>(url, {
			method: 'POST',
			retry: 0,
			ignoreResponseError: true,
			responseType: 'text',
			headers: {
				'x-intro-proxy-request-id': requestId,
				...(payload.traceId
					? { 'x-intro-proxy-trace-id': payload.traceId }
					: {}),
			},
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

		phase = 'envelope'
		const raw = response._data ?? ''
		Object.assign(meta, {
			outerStatus: response.status,
			contentType: response.headers.get('content-type'),
			responseBytes: Buffer.byteLength(raw),
			eoId: response.headers.get('eo-log-uuid')?.slice(0, 128),
			cfRay: response.headers.get('cf-ray')?.slice(0, 128),
			workerRequestId: response.headers
				.get('x-intro-proxy-worker-id')
				?.slice(0, 128),
		})
		let parsed: unknown
		try {
			parsed = JSON.parse(raw)
		} catch {
			const error = new Error(
				'Intro proxy returned non-JSON response.',
			) as Error & {
				statusCode?: number
				preWorkerResponse?: boolean
			}
			error.statusCode = response.status
			error.preWorkerResponse = !response.headers.get('x-intro-proxy-worker-id')
			throw error
		}
		const envelope = normalizeEnvelope(parsed)
		envelope.outerStatus = response.status
		envelope.workerRequestId =
			response.headers.get('x-intro-proxy-worker-id') ?? envelope.requestId
		const durationMs = Math.round(performance.now() - startedAt)
		Object.assign(meta, {
			durationMs,
			workerRequestId: envelope.workerRequestId,
			workerDurationMs: envelope.durationMs,
			outsideWorkerMs:
				envelope.durationMs === undefined
					? undefined
					: Math.max(0, durationMs - envelope.durationMs),
			upstreamStatus: envelope.status,
		})
		if (!response.ok || !envelope.ok || durationMs >= 1000) {
			console.warn('INTRO_PROXY_REQUEST_COMPLETED', meta)
		} else if (verbose) {
			console.info('INTRO_PROXY_REQUEST_COMPLETED', meta)
		}
		return envelope
	} catch (error) {
		const cause =
			isRecord(error) && isRecord(error.cause) ? error.cause : undefined
		console.error('INTRO_PROXY_REQUEST_FAILED', {
			...meta,
			phase,
			durationMs: Math.round(performance.now() - startedAt),
			errorName: error instanceof Error ? error.name : undefined,
			errorCode:
				typeof cause?.code === 'string' ? cause.code.slice(0, 64) : undefined,
		})
		throw error
	}
}

export const resolveBangumiImageProxyUrl = (imageUrl: string): string =>
	imageUrl.trim()
		? `/api/bangumi/image?url=${encodeURIComponent(imageUrl.trim())}`
		: ''

export const isIntroProxyTransportError = (
	envelope: IntroProxyEnvelope,
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

export const resolveIntroProxyBodyText = (
	envelope: IntroProxyEnvelope,
): string => {
	if (typeof envelope.body === 'string') {
		return envelope.body
	}

	return ''
}

export const resolveIntroProxyJsonBody = <T>(
	envelope: IntroProxyEnvelope,
): T => {
	const raw = resolveIntroProxyBodyText(envelope)

	if (!raw) {
		throw new Error('Intro proxy response body is empty.')
	}

	try {
		return JSON.parse(raw) as T
	} catch {
		throw new Error('Intro proxy response body is not valid JSON.')
	}
}
