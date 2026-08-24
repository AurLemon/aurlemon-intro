export type OAuthProviderName = 'GITHUB' | 'LINUX_DO'

export interface AuthIdentity {
	id: string
	provider: OAuthProviderName
	providerUsername: string
	displayName: string | null
	avatarUrl: string
	profileUrl: string
}

export interface AuthUser {
	id: string
	username: string
	displayName: string
	avatarUrl: string
	hasVerifiedPrimaryEmail: boolean
	preferredAvatarIdentityId: string | null
	preferredLocale: string
	isAdmin: boolean
	identities: AuthIdentity[]
}

export interface AccountEmail {
	id: string
	email: string
	verified: boolean
	isPrimary: boolean
	source: 'GITHUB' | 'MANUAL'
}

export interface AccountNotificationPreference {
	replyEmailEnabled: boolean
	adminCommentEmailEnabled: boolean
	adminFriendLinkEmailEnabled: boolean
}

export interface AccountDetails {
	user: AuthUser
	emails: AccountEmail[]
	notifications: AccountNotificationPreference
}

export interface SiteLikeSummary {
	totalCount: number
	hasLiked: boolean
	activeUserCount: number
}

export interface SiteLikeListItem {
	likeId: number
	maskedFingerprint: string
	ip: string
	ipVersion: 4 | 6 | null
	ipRegionLabel: string | null
	likedAt: string
}

export interface SiteLikeListPagination {
	page: number
	pageSize: number
	totalPages: number
	totalCount: number
	hasPrev: boolean
	hasNext: boolean
}

export interface SiteLikeListResponse {
	items: SiteLikeListItem[]
	pagination: SiteLikeListPagination
}

export interface LoginUserListItem {
	id: string
	displayUsername: string
	avatarUrl: string | null
	providers: OAuthProviderName[]
	identities: LoginUserListIdentity[]
	createdAt: string
	canViewDetails: boolean
}

export interface LoginUserListIdentity {
	provider: OAuthProviderName
	profileUrl: string
}

export interface LoginUserListPagination {
	page: number
	pageSize: number
	totalPages: number
	totalCount: number
	hasPrev: boolean
	hasNext: boolean
}

export interface LoginUserListResponse {
	items: LoginUserListItem[]
	pagination: LoginUserListPagination
}

export interface SiteLikedEvent {
	likeId: number
	fingerprint: string
	ip: string
	uuid: string
	createdAt: string
}

export interface CommentCreatedEvent {
	commentId: string
	parentId: string | null
	authorUserId: string
	authorUsername: string
	avatarUrl: string
	content: string
	createdAt: string
}

export interface CommentLikedEvent {
	commentLikeId: string
	commentId: string
	actorUserId: string
	actorUsername: string
	createdAt: string
}

export interface CommentUnlikedEvent {
	commentLikeId: string
	commentId: string
	actorUserId: string
	actorUsername: string
	removedAt: string
}

export interface CommentUpdatedEvent {
	commentId: string
	actorUserId: string
	actorUsername: string
	content: string
	updatedAt: string
}

export interface CommentDeletedEvent {
	commentId: string
	actorUserId: string
	actorUsername: string
	deletedAt: string
}

export interface FriendLinkApplicationSubmittedEvent {
	applicationId: string
	applicantUserId: string
	applicantUsername: string
	name: string
	url: string
	desc: string
	imageBase64: string
	expiresAt: string
	createdAt: string
}

export interface FriendLinkApplicationApprovedEvent {
	applicationId: string
	approvedByUserId: string
	approvedByUsername: string
	approvedAt: string
}

export interface FriendLinkApplicationRejectedEvent {
	applicationId: string
	rejectedByUserId: string
	rejectedByUsername: string
	rejectedAt: string
}

export interface FriendLinkCreatedEvent {
	friendLinkId: string
	name: string
	url: string
	desc: string
	imageBase64: string
	createdByUserId: string
	createdByUsername: string
	createdAt: string
}

export interface FriendLinkUpdatedEvent {
	friendLinkId: string
	name: string
	url: string
	desc: string
	imageBase64: string
	updatedByUserId: string
	updatedByUsername: string
	updatedAt: string
}

export interface FriendLinkDeletedEvent {
	friendLinkId: string
	deletedByUserId: string
	deletedByUsername: string
	deletedAt: string
}

export interface PendingFriendLinkExpiredEvent {
	applicationId: string
	expiredAt: string
}

export interface MessageCommentItem {
	id: string
	floor: number
	parentId: string | null
	isPinned: boolean
	content: string
	authorUserId: string | null
	username: string
	displayName: string
	avatarUrl: string
	identities: AuthIdentity[]
	createdAt: string
	likeCount: number
	hasLiked: boolean
	likedByUsernames: string[]
	canEdit: boolean
	canDelete: boolean
	canPin: boolean
	replyToUsername: string | null
	replyToFloor: number | null
	isNestedReply: boolean
	replies: MessageCommentItem[]
}

export type MessageBoardSortOrder = 'latest' | 'earliest'

export type MessageBoardPinFilter = 'all' | 'pinned' | 'unpinned'

export interface MessageBoardQuery {
	page: number
	pageSize: number
	sort: MessageBoardSortOrder
	pinFilter: MessageBoardPinFilter
}

export interface MessageBoardResponse {
	items: MessageCommentItem[]
	pagination: MessageBoardPagination
	currentUser: AuthUser | null
}

export interface MessageBoardPagination {
	page: number
	pageSize: number
	totalPages: number
	totalRootCount: number
	totalCommentCount: number
	hasPrev: boolean
	hasNext: boolean
}

export interface FriendLinkItem {
	id: string
	name: string
	url: string
	desc: string
	icon: string
	source: 'database'
}

export interface FriendLinkApplicationItem {
	id: string
	name: string
	url: string
	desc: string
	imageBase64: string
	applicantUsername: string
	status: 'pending' | 'approved' | 'rejected' | 'expired'
	expiresAt: string
	approvedAt: string | null
	approvedByUsername: string | null
	createdAt: string
}

export interface FriendLinksResponse {
	items: FriendLinkItem[]
	currentUser: AuthUser | null
}

export interface AdminFriendLinkListItem {
	id: string
	type: 'friend-link' | 'pending-application'
	name: string
	url: string
	desc: string
	imageBase64: string
	createdAt: string
	applicantUsername: string | null
}
