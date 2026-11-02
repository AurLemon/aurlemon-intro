import prisma from '~/lib/prisma'
import { friendLinkOwnerAccount } from '~/shared/utils/friend-link-owner'
import type {
	FriendLinkOwnerAccount,
	OAuthProviderName,
} from '~/shared/types/social'
import {
	isGithubProxyEnabled,
	isLinuxDoProxyEnabled,
	proxyIntroRequest,
	resolveIntroProxyJsonBody,
} from '~/server/utils/intro-proxy'

export interface FriendLinkOwnerPayload {
	ownerGithubLogin?: string | null
	ownerLinuxDoUsername?: string | null
}

interface OwnerSource extends FriendLinkOwnerPayload {
	owner?: {
		identities: {
			provider: OAuthProviderName
			providerUsername: string
			providerDisplayName: string | null
			avatarUrl: string
		}[]
	} | null
}

export const ownerIdentitySelect = {
	identities: {
		select: {
			provider: true,
			providerUsername: true,
			providerDisplayName: true,
			avatarUrl: true,
		},
	},
} as const

export const ownerLogins = (item: OwnerSource) => ({
	ownerGithubLogin:
		item.ownerGithubLogin ??
		item.owner?.identities.find((i) => i.provider === 'GITHUB')
			?.providerUsername ??
		null,
	ownerLinuxDoUsername:
		item.ownerLinuxDoUsername ??
		item.owner?.identities.find((i) => i.provider === 'LINUX_DO')
			?.providerUsername ??
		null,
})

export const mapOwnerAccount = (
	item: OwnerSource,
): FriendLinkOwnerAccount | null => {
	const logins = ownerLogins(item)
	const provider = logins.ownerGithubLogin ? 'GITHUB' : 'LINUX_DO'
	const username = logins.ownerGithubLogin || logins.ownerLinuxDoUsername
	if (!username) return null
	const account = friendLinkOwnerAccount(provider, username)
	const identity = item.owner?.identities.find(
		(i) =>
			i.provider === provider &&
			i.providerUsername.toLowerCase() === username.toLowerCase(),
	)
	return identity
		? {
				...account,
				displayName: identity.providerDisplayName || username,
				avatarUrl: identity.avatarUrl,
			}
		: account
}

export const normalizeOwnerUsername = (
	value: unknown,
	provider: OAuthProviderName,
): string | null => {
	if (value === null || value === undefined || value === '') return null
	if (typeof value !== 'string')
		throw createError({
			statusCode: 400,
			statusMessage: 'INVALID_FRIEND_LINK_OWNER',
		})
	const username = value.trim().replace(/^@/, '')
	if (!username) return null
	const pattern =
		provider === 'GITHUB'
			? /^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i
			: /^[a-z\d_][a-z\d_.-]{0,59}$/i
	if (!pattern.test(username))
		throw createError({
			statusCode: 400,
			statusMessage: 'INVALID_FRIEND_LINK_OWNER',
		})
	return username
}

const lookupFriendLinkOwnerUncached = async (
	provider: OAuthProviderName,
	value: unknown,
): Promise<FriendLinkOwnerAccount> => {
	const username = normalizeOwnerUsername(value, provider)
	if (!username)
		throw createError({
			statusCode: 400,
			statusMessage: 'INVALID_FRIEND_LINK_OWNER',
		})
	const identity = await prisma.oAuthIdentity.findFirst({
		where: { provider, providerUsernameNormalized: username.toLowerCase() },
	})
	if (identity)
		return {
			...friendLinkOwnerAccount(provider, identity.providerUsername),
			displayName: identity.providerDisplayName || identity.providerUsername,
			avatarUrl: identity.avatarUrl,
		}
	try {
		if (provider === 'GITHUB') {
			interface GithubProfile {
				login: string
				name: string | null
				avatar_url: string
				type: string
			}
			const url = `https://api.github.com/users/${encodeURIComponent(username)}`
			const token =
				process.env.GITHUB_TOKEN?.trim() || process.env.GITHUB_PAT?.trim()
			const headers = {
				...(token ? { authorization: `Bearer ${token}` } : {}),
				accept: 'application/vnd.github+json',
				'user-agent': 'AurLemon-Intro',
			}
			let profile: GithubProfile
			if (isGithubProxyEnabled()) {
				const result = await proxyIntroRequest({
					url,
					headers,
					timeoutMs: 9000,
				})
				if (!result.ok) throw createError({ statusCode: result.status })
				profile = resolveIntroProxyJsonBody<GithubProfile>(result)
			} else
				profile = await $fetch<GithubProfile>(url, {
					headers,
					timeout: 9000,
					retry: 0,
				})
			if (!profile.login || profile.type !== 'User')
				throw createError({ statusCode: 404 })
			return {
				...friendLinkOwnerAccount(provider, profile.login),
				displayName: profile.name || profile.login,
				avatarUrl: profile.avatar_url,
			}
		}
		interface LinuxDoProfile {
			user: { username: string; name: string | null; avatar_template: string }
		}
		const url = `https://linux.do/u/${encodeURIComponent(username)}.json`
		let result: LinuxDoProfile
		if (isLinuxDoProxyEnabled()) {
			const envelope = await proxyIntroRequest({ url, timeoutMs: 9000 })
			if (!envelope.ok) throw createError({ statusCode: envelope.status })
			result = resolveIntroProxyJsonBody<LinuxDoProfile>(envelope)
		} else
			result = await $fetch<LinuxDoProfile>(url, { timeout: 9000, retry: 0 })
		if (!result.user?.username) throw createError({ statusCode: 404 })
		return {
			...friendLinkOwnerAccount(provider, result.user.username),
			displayName: result.user.name || result.user.username,
			avatarUrl: new URL(
				result.user.avatar_template.replace('{size}', '64'),
				'https://linux.do',
			).href,
		}
	} catch (error) {
		const status = (error as { statusCode?: number }).statusCode
		// Public forum profiles may require an interactive challenge. Administrators
		// can still explicitly link a username; never pretend its profile was read.
		if (provider === 'LINUX_DO' && status !== 404)
			return {
				...friendLinkOwnerAccount(provider, username),
				profileResolved: false,
			}
		throw createError({
			statusCode: status === 404 ? 404 : 502,
			statusMessage:
				status === 404
					? 'FRIEND_LINK_OWNER_NOT_FOUND'
					: 'FRIEND_LINK_OWNER_LOOKUP_FAILED',
		})
	}
}

const ownerCache = new Map<
	string,
	{ account: FriendLinkOwnerAccount; expires: number }
>()
export const lookupFriendLinkOwner = async (
	provider: OAuthProviderName,
	value: unknown,
) => {
	const username = normalizeOwnerUsername(value, provider)
	const key = `${provider}:${username?.toLowerCase()}`
	const cached = ownerCache.get(key)
	if (cached && cached.expires > Date.now()) return cached.account
	const account = await lookupFriendLinkOwnerUncached(provider, username)
	if (ownerCache.size >= 200) ownerCache.delete(ownerCache.keys().next().value!)
	ownerCache.set(key, { account, expires: Date.now() + 300_000 })
	return account
}

export const resolveOwnerChanges = async (
	payload: FriendLinkOwnerPayload,
	current: OwnerSource = {},
): Promise<FriendLinkOwnerPayload & { ownerUserId?: null }> => {
	const previous = ownerLogins(current)
	const next = { ...previous }
	let changed = false
	for (const [field, provider] of [
		['ownerGithubLogin', 'GITHUB'],
		['ownerLinuxDoUsername', 'LINUX_DO'],
	] as const) {
		if (payload[field] === undefined) continue
		const username = normalizeOwnerUsername(payload[field], provider)
		if (
			(username?.toLowerCase() ?? null) ===
			(previous[field]?.toLowerCase() ?? null)
		)
			continue
		next[field] = username
			? (await lookupFriendLinkOwner(provider, username)).username
			: null
		changed = true
	}
	return changed ? { ...next, ownerUserId: null } : {}
}
