export interface GithubAuthUser {
	githubLogin: string
	avatarUrl: string
	profileUrl: string
	isAdmin: boolean
}

export interface SiteLikeSummary {
	totalCount: number
	hasLiked: boolean
	githubLoginUserCount: number
}

export interface SiteLikeListItem {
	likeId: number
	maskedFingerprint: string
	ip: string
	ipVersion: 4 | 6 | null
	ipRegionLabel: string | null
	likedAt: string
}

export interface SiteLikeListResponse {
	items: SiteLikeListItem[]
}

export interface GithubLoginUserListItem {
	id: string
	displayLogin: string
	avatarUrl: string | null
	profileUrl: string | null
	createdAt: string
	expiresAt: string
	canViewProfile: boolean
}

export interface GithubLoginUserListResponse {
	items: GithubLoginUserListItem[]
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
	githubLogin: string
	avatarUrl: string
	profileUrl: string
	content: string
	createdAt: string
}

export interface CommentLikedEvent {
	commentLikeId: string
	commentId: string
	githubLogin: string
	createdAt: string
}

export interface CommentUnlikedEvent {
	commentLikeId: string
	commentId: string
	githubLogin: string
	removedAt: string
}

export interface CommentUpdatedEvent {
	commentId: string
	githubLogin: string
	content: string
	updatedAt: string
}

export interface CommentDeletedEvent {
	commentId: string
	githubLogin: string
	deletedAt: string
}

export interface FriendLinkApplicationSubmittedEvent {
	applicationId: string
	applicantGithubLogin: string
	name: string
	url: string
	desc: string
	imageBase64: string
	expiresAt: string
	createdAt: string
}

export interface FriendLinkApplicationApprovedEvent {
	applicationId: string
	approvedByGithubLogin: string
	approvedAt: string
}

export interface FriendLinkCreatedEvent {
	friendLinkId: string
	name: string
	url: string
	desc: string
	imageBase64: string
	createdByGithubLogin: string
	createdAt: string
}

export interface FriendLinkUpdatedEvent {
	friendLinkId: string
	name: string
	url: string
	desc: string
	imageBase64: string
	updatedByGithubLogin: string
	updatedAt: string
}

export interface FriendLinkDeletedEvent {
	friendLinkId: string
	deletedByGithubLogin: string
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
	githubLogin: string
	avatarUrl: string
	profileUrl: string
	createdAt: string
	likeCount: number
	hasLiked: boolean
	likedByGithubLogins: string[]
	canEdit: boolean
	canDelete: boolean
	canPin: boolean
	replyToGithubLogin: string | null
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
	currentUser: GithubAuthUser | null
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
	applicantGithubLogin: string
	status: 'pending' | 'approved' | 'rejected' | 'expired'
	expiresAt: string
	approvedAt: string | null
	approvedByGithubLogin: string | null
	createdAt: string
}

export interface FriendLinksResponse {
	items: FriendLinkItem[]
	currentUser: GithubAuthUser | null
}

export interface AdminFriendLinkListItem {
	id: string
	type: 'friend-link' | 'pending-application'
	name: string
	url: string
	desc: string
	imageBase64: string
	createdAt: string
	applicantGithubLogin: string | null
}
