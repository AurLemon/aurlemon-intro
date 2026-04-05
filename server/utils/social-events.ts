import { EventEmitter } from 'node:events'
import type {
	CommentCreatedEvent,
	CommentDeletedEvent,
	CommentLikedEvent,
	CommentUpdatedEvent,
	FriendLinkApplicationApprovedEvent,
	FriendLinkApplicationSubmittedEvent,
	FriendLinkCreatedEvent,
	FriendLinkDeletedEvent,
	FriendLinkUpdatedEvent,
	PendingFriendLinkExpiredEvent,
	SiteLikedEvent,
} from '~/shared/types/social'

export const SOCIAL_EVENT_NAMES = {
	SITE_LIKED: 'site.liked',
	COMMENT_CREATED: 'comment.created',
	COMMENT_LIKED: 'comment.liked',
	COMMENT_UPDATED: 'comment.updated',
	COMMENT_DELETED: 'comment.deleted',
	FRIEND_LINK_APPLICATION_SUBMITTED: 'friend-link.application.submitted',
	FRIEND_LINK_APPLICATION_APPROVED: 'friend-link.application.approved',
	FRIEND_LINK_CREATED: 'friend-link.created',
	FRIEND_LINK_UPDATED: 'friend-link.updated',
	FRIEND_LINK_DELETED: 'friend-link.deleted',
	FRIEND_LINK_APPLICATION_EXPIRED: 'friend-link.application.expired',
} as const

interface SocialEventMap {
	[SOCIAL_EVENT_NAMES.SITE_LIKED]: SiteLikedEvent
	[SOCIAL_EVENT_NAMES.COMMENT_CREATED]: CommentCreatedEvent
	[SOCIAL_EVENT_NAMES.COMMENT_LIKED]: CommentLikedEvent
	[SOCIAL_EVENT_NAMES.COMMENT_UPDATED]: CommentUpdatedEvent
	[SOCIAL_EVENT_NAMES.COMMENT_DELETED]: CommentDeletedEvent
	[SOCIAL_EVENT_NAMES.FRIEND_LINK_APPLICATION_SUBMITTED]: FriendLinkApplicationSubmittedEvent
	[SOCIAL_EVENT_NAMES.FRIEND_LINK_APPLICATION_APPROVED]: FriendLinkApplicationApprovedEvent
	[SOCIAL_EVENT_NAMES.FRIEND_LINK_CREATED]: FriendLinkCreatedEvent
	[SOCIAL_EVENT_NAMES.FRIEND_LINK_UPDATED]: FriendLinkUpdatedEvent
	[SOCIAL_EVENT_NAMES.FRIEND_LINK_DELETED]: FriendLinkDeletedEvent
	[SOCIAL_EVENT_NAMES.FRIEND_LINK_APPLICATION_EXPIRED]: PendingFriendLinkExpiredEvent
}

class SocialEventBus extends EventEmitter {
	override emit<K extends keyof SocialEventMap>(
		eventName: K,
		payload: SocialEventMap[K],
	) {
		return super.emit(eventName, payload)
	}

	override on<K extends keyof SocialEventMap>(
		eventName: K,
		listener: (payload: SocialEventMap[K]) => void | Promise<void>,
	) {
		return super.on(eventName, listener)
	}
}

declare global {
	var __socialEventBus__: SocialEventBus | undefined
}

export const socialEventBus =
	globalThis.__socialEventBus__ ?? new SocialEventBus()

if (!globalThis.__socialEventBus__) {
	globalThis.__socialEventBus__ = socialEventBus
}
