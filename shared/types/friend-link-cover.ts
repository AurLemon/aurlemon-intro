export type FriendLinkCoverVariant = 'desktop' | 'mobile'

export interface FriendLinkCoverSummary {
	url: string | null
	mobileUrl: string | null
	mobileCapturedAt: string | null
	capturedAt: string | null
}

export interface FriendLinkCoverState {
	id: string
	status: 'ready' | 'partial' | 'fallback' | 'failed' | 'queued'
	coverUrl: string | null
	mobileCoverUrl: string | null
	capturedAt: string | null
	attemptedAt: string | null
}

export interface FriendLinkCoverSettings {
	intervalDays: 0 | 7 | 30 | 90
}

export interface FriendLinkCoverAdminResponse {
	browserAvailable: boolean
	settings: FriendLinkCoverSettings
	items: FriendLinkCoverState[]
}
