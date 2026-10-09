import { OAuthProvider } from '~/generated/prisma/client'
import {
	exchangeGithubCode,
	fetchGithubEmails,
	fetchGithubUser,
} from '~/server/utils/social-auth'
import {
	isLinuxDoProxyEnabled,
	proxyIntroRequest,
	resolveIntroProxyJsonBody,
} from '~/server/utils/intro-proxy'

export interface NormalizedOAuthIdentity {
	provider: OAuthProvider
	providerUserId: string
	providerUsername: string
	displayName: string | null
	avatarUrl: string
	profileUrl: string
	verifiedPrimaryEmail: string | null
}

export interface OAuthAuthorizationOptions {
	state: string
	codeChallenge: string | null
}

export interface OAuthCodeExchangeOptions {
	code: string
	codeVerifier: string | null
}

export interface OAuthProviderAdapter {
	provider: OAuthProvider
	createAuthorizationUrl(options: OAuthAuthorizationOptions): string
	exchangeCode(
		options: OAuthCodeExchangeOptions,
	): Promise<NormalizedOAuthIdentity>
}

interface LinuxDoTokenResponse {
	access_token?: string
}

interface LinuxDoUserResponse {
	id?: number | string
	username?: string
	name?: string | null
	avatar_template?: string
}

const getLinuxDoTokenUrl = (): string =>
	process.env.LINUX_DO_TOKEN_URL ?? 'https://connect.linux.do/oauth2/token'

const getLinuxDoUserUrl = (): string =>
	process.env.LINUX_DO_USER_URL ?? 'https://connect.linux.do/api/user'

const fetchLinuxDoJson = async <T>(options: {
	url: string
	method: 'GET' | 'POST'
	headers: Record<string, string>
	body?: string
	errorStatusMessage: string
}): Promise<T> => {
	if (!isLinuxDoProxyEnabled()) {
		try {
			return (await $fetch<T>(options.url, {
				method: options.method,
				headers: options.headers,
				body: options.body,
				timeout: 20_000,
			})) as T
		} catch {
			throw createError({
				statusCode: 502,
				statusMessage: options.errorStatusMessage,
			})
		}
	}

	try {
		const envelope = await proxyIntroRequest({
			url: options.url,
			method: options.method,
			headers: options.headers,
			bodyType: options.body ? 'raw' : undefined,
			body: options.body,
			timeoutMs: 20_000,
			notConfiguredStatusMessage: 'LINUX_DO_OAUTH_NOT_CONFIGURED',
		})

		if (!envelope.ok) {
			throw createError({
				statusCode:
					envelope.status === 401 || envelope.status === 403 ? 401 : 502,
				statusMessage: options.errorStatusMessage,
			})
		}

		return resolveIntroProxyJsonBody<T>(envelope)
	} catch (error) {
		if (
			getErrorStatusCode(error) === 401 ||
			getErrorStatusCode(error) === 500
		) {
			throw error
		}

		throw createError({
			statusCode: 502,
			statusMessage: options.errorStatusMessage,
		})
	}
}

const getErrorStatusCode = (error: unknown): number | null => {
	if (!error || typeof error !== 'object' || !('statusCode' in error)) {
		return null
	}

	const { statusCode } = error
	return typeof statusCode === 'number' ? statusCode : null
}

const getCallbackUrl = (provider: OAuthProvider): string => {
	const configured =
		provider === OAuthProvider.GITHUB
			? process.env.GITHUB_CALLBACK_URL
			: process.env.LINUX_DO_CALLBACK_URL
	if (configured?.trim()) return configured.trim()
	const siteUrl = process.env.NUXT_SITE_URL?.replace(/\/$/, '')
	return siteUrl
		? `${siteUrl}/api/auth/${provider === OAuthProvider.GITHUB ? 'github' : 'linuxdo'}/callback`
		: ''
}

const githubAdapter: OAuthProviderAdapter = {
	provider: OAuthProvider.GITHUB,
	createAuthorizationUrl: ({ state, codeChallenge }) => {
		const clientId = process.env.GITHUB_CLIENT_ID
		const callbackUrl = getCallbackUrl(OAuthProvider.GITHUB)
		if (!clientId || !callbackUrl || !codeChallenge) {
			throw createError({
				statusCode: 500,
				statusMessage: 'GITHUB_OAUTH_NOT_CONFIGURED',
			})
		}
		const url = new URL('https://github.com/login/oauth/authorize')
		url.searchParams.set('client_id', clientId)
		url.searchParams.set('redirect_uri', callbackUrl)
		url.searchParams.set('scope', 'read:user user:email')
		url.searchParams.set('state', state)
		url.searchParams.set('code_challenge', codeChallenge)
		url.searchParams.set('code_challenge_method', 'S256')
		return url.toString()
	},
	exchangeCode: async ({ code, codeVerifier }) => {
		const token = await exchangeGithubCode(code, codeVerifier)
		const [userResult, emails] = await Promise.all([
			fetchGithubUser(token.accessToken),
			fetchGithubEmails(token.accessToken),
		])
		const user = userResult.user
		const primaryEmail = emails.find((item) => item.primary && item.verified)
		return {
			provider: OAuthProvider.GITHUB,
			providerUserId: String(user.id),
			providerUsername: user.login,
			displayName: user.name?.trim() || user.login,
			avatarUrl: user.avatar_url,
			profileUrl: user.html_url,
			verifiedPrimaryEmail: primaryEmail?.email ?? null,
		}
	},
}

const linuxDoAdapter: OAuthProviderAdapter = {
	provider: OAuthProvider.LINUX_DO,
	createAuthorizationUrl: ({ state }) => {
		const clientId = process.env.LINUX_DO_CLIENT_ID
		const callbackUrl = getCallbackUrl(OAuthProvider.LINUX_DO)
		if (!clientId || !callbackUrl) {
			throw createError({
				statusCode: 500,
				statusMessage: 'LINUX_DO_OAUTH_NOT_CONFIGURED',
			})
		}
		const url = new URL(
			process.env.LINUX_DO_AUTHORIZE_URL ??
				'https://connect.linux.do/oauth2/authorize',
		)
		url.searchParams.set('client_id', clientId)
		url.searchParams.set('response_type', 'code')
		url.searchParams.set('redirect_uri', callbackUrl)
		url.searchParams.set('state', state)
		return url.toString()
	},
	exchangeCode: async ({ code }) => {
		const clientId = process.env.LINUX_DO_CLIENT_ID
		const clientSecret = process.env.LINUX_DO_CLIENT_SECRET
		const callbackUrl = getCallbackUrl(OAuthProvider.LINUX_DO)
		if (!clientId || !clientSecret || !callbackUrl) {
			throw createError({
				statusCode: 500,
				statusMessage: 'LINUX_DO_OAUTH_NOT_CONFIGURED',
			})
		}

		const tokenResponse = await fetchLinuxDoJson<LinuxDoTokenResponse>({
			url: getLinuxDoTokenUrl(),
			method: 'POST',
			headers: {
				authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
				'content-type': 'application/x-www-form-urlencoded',
				accept: 'application/json',
			},
			body: new URLSearchParams({
				grant_type: 'authorization_code',
				code,
				redirect_uri: callbackUrl,
			}).toString(),
			errorStatusMessage: 'LINUX_DO_OAUTH_TOKEN_EXCHANGE_FAILED',
		})

		if (!tokenResponse.access_token) {
			throw createError({
				statusCode: 401,
				statusMessage: 'LINUX_DO_OAUTH_TOKEN_EXCHANGE_FAILED',
			})
		}

		const user = await fetchLinuxDoJson<LinuxDoUserResponse>({
			url: getLinuxDoUserUrl(),
			method: 'GET',
			headers: {
				authorization: `Bearer ${tokenResponse.access_token}`,
				accept: 'application/json',
			},
			errorStatusMessage: 'LINUX_DO_OAUTH_CALLBACK_FAILED',
		})
		if (user.id === undefined || !user.username || !user.avatar_template) {
			throw createError({
				statusCode: 401,
				statusMessage: 'LINUX_DO_OAUTH_USER_PAYLOAD_INVALID',
			})
		}

		return {
			provider: OAuthProvider.LINUX_DO,
			providerUserId: String(user.id),
			providerUsername: user.username,
			displayName: user.name?.trim() || user.username,
			avatarUrl: user.avatar_template.replace('{size}', '288'),
			profileUrl: `https://linux.do/u/${encodeURIComponent(user.username)}`,
			verifiedPrimaryEmail: null,
		}
	},
}

export const getOAuthProviderAdapter = (
	provider: OAuthProvider,
): OAuthProviderAdapter =>
	provider === OAuthProvider.GITHUB ? githubAdapter : linuxDoAdapter
