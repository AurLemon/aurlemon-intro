import type { OAuthProvider, Prisma } from '@prisma/client'

export const DOMAIN_EVENT_NAMES = {
	USER_CREATED: 'user.created',
	ACCOUNT_MERGED: 'account.merged',
	SITE_LIKED: 'site.liked',
	COMMENT_CREATED: 'comment.created',
	COMMENT_LIKED: 'comment.liked',
	COMMENT_UNLIKED: 'comment.unliked',
	COMMENT_UPDATED: 'comment.updated',
	COMMENT_DELETED: 'comment.deleted',
	COMMENT_PIN_CHANGED: 'comment.pin-changed',
	FRIEND_LINK_APPLICATION_SUBMITTED: 'friend-link.application.submitted',
	FRIEND_LINK_APPLICATION_APPROVED: 'friend-link.application.approved',
	FRIEND_LINK_APPLICATION_EXPIRED: 'friend-link.application.expired',
	FRIEND_LINK_CREATED: 'friend-link.created',
	FRIEND_LINK_UPDATED: 'friend-link.updated',
	FRIEND_LINK_DELETED: 'friend-link.deleted',
} as const

export interface DomainEventPayloadMap {
	[DOMAIN_EVENT_NAMES.USER_CREATED]: {
		userId: string
		provider: OAuthProvider
		providerUserId: string
	}
	[DOMAIN_EVENT_NAMES.ACCOUNT_MERGED]: {
		sourceUserId: string
		survivorUserId: string
	}
	[DOMAIN_EVENT_NAMES.SITE_LIKED]: {
		likeId: number
		fingerprint: string
	}
	[DOMAIN_EVENT_NAMES.COMMENT_CREATED]: {
		commentId: string
		parentId: string | null
		authorUserId: string
	}
	[DOMAIN_EVENT_NAMES.COMMENT_LIKED]: {
		commentId: string
		commentLikeId: string
		actorUserId: string
	}
	[DOMAIN_EVENT_NAMES.COMMENT_UNLIKED]: {
		commentId: string
		commentLikeId: string
		actorUserId: string
	}
	[DOMAIN_EVENT_NAMES.COMMENT_UPDATED]: {
		commentId: string
		actorUserId: string
	}
	[DOMAIN_EVENT_NAMES.COMMENT_DELETED]: {
		commentId: string
		actorUserId: string
	}
	[DOMAIN_EVENT_NAMES.COMMENT_PIN_CHANGED]: {
		commentId: string
		actorUserId: string
		pinned: boolean
	}
	[DOMAIN_EVENT_NAMES.FRIEND_LINK_APPLICATION_SUBMITTED]: {
		applicationId: string
		applicantUserId: string
	}
	[DOMAIN_EVENT_NAMES.FRIEND_LINK_APPLICATION_APPROVED]: {
		applicationId: string
		approvedByUserId: string
	}
	[DOMAIN_EVENT_NAMES.FRIEND_LINK_APPLICATION_EXPIRED]: {
		applicationId: string
	}
	[DOMAIN_EVENT_NAMES.FRIEND_LINK_CREATED]: {
		friendLinkId: string
		createdByUserId: string
	}
	[DOMAIN_EVENT_NAMES.FRIEND_LINK_UPDATED]: {
		friendLinkId: string
		updatedByUserId: string
	}
	[DOMAIN_EVENT_NAMES.FRIEND_LINK_DELETED]: {
		friendLinkId: string
		deletedByUserId: string
	}
}

export const insertDomainEvent = async <K extends keyof DomainEventPayloadMap>(
	tx: Prisma.TransactionClient,
	eventType: K,
	aggregateId: string,
	payload: DomainEventPayloadMap[K],
): Promise<void> => {
	await tx.domainEventOutbox.create({
		data: {
			eventType,
			aggregateId,
			payloadJson: JSON.stringify(payload),
		},
	})
}
