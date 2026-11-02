import type { FriendLinkOwnerAccount, OAuthProviderName } from '../types/social'

export const friendLinkOwnerAccount = (
	provider: OAuthProviderName,
	username: string,
): FriendLinkOwnerAccount => ({
	provider,
	username,
	displayName: username,
	avatarUrl:
		provider === 'GITHUB'
			? `https://github.com/${encodeURIComponent(username)}.png?size=64`
			: '',
	profileUrl:
		provider === 'GITHUB'
			? `https://github.com/${encodeURIComponent(username)}`
			: `https://linux.do/u/${encodeURIComponent(username)}`,
})
