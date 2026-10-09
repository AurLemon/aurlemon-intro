import { Prisma } from '~/generated/prisma/client'
import prisma from '~/lib/prisma'
import {
	DOMAIN_EVENT_NAMES,
	insertDomainEvent,
} from '~/server/utils/domain-events'
import type { MessageBoardPaginationQuery } from '~/server/utils/message-board-pagination'
import {
	SOCIAL_EVENT_NAMES,
	socialEventBus,
} from '~/server/utils/social-events'
import { getLegacySnapshot } from '~/server/utils/user-auth'
import type {
	AuthIdentity,
	AuthUser,
	MessageBoardPagination,
	MessageBoardSortOrder,
	MessageCommentItem,
} from '~/shared/types/social'

const createCreatedAtSorter = (order: MessageBoardSortOrder) => {
	if (order === 'earliest') {
		return (a: MessageCommentItem, b: MessageCommentItem) =>
			new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
	}
	return (a: MessageCommentItem, b: MessageCommentItem) =>
		new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
}

const createRootSorter = (order: MessageBoardSortOrder) => {
	const createdAtSorter = createCreatedAtSorter(order)
	return (a: MessageCommentItem, b: MessageCommentItem) => {
		if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
		return createdAtSorter(a, b)
	}
}

const isUniqueConstraintError = (error: unknown): boolean =>
	error instanceof Prisma.PrismaClientKnownRequestError &&
	error.code === 'P2002'

const currentUserOwnsLegacyLogin = (
	currentUser: AuthUser | null,
	githubLogin: string,
): boolean =>
	Boolean(
		currentUser?.identities.some(
			(identity) =>
				identity.provider === 'GITHUB' &&
				identity.providerUsername.toLowerCase() === githubLogin.toLowerCase(),
		),
	)

const mapIdentity = (identity: {
	id: string
	provider: 'GITHUB' | 'LINUX_DO'
	providerUsername: string
	providerDisplayName: string | null
	avatarUrl: string
	profileUrl: string
}): AuthIdentity => ({
	id: identity.id,
	provider: identity.provider,
	providerUsername: identity.providerUsername,
	displayName: identity.providerDisplayName,
	avatarUrl: identity.avatarUrl,
	profileUrl: identity.profileUrl,
})

export const listMessageBoard = async (
	currentUser: AuthUser | null,
	options: MessageBoardPaginationQuery,
): Promise<{
	items: MessageCommentItem[]
	pagination: MessageBoardPagination
}> => {
	const comments = await prisma.messageComment.findMany({
		include: {
			author: {
				include: {
					identities: { orderBy: { createdAt: 'asc' } },
				},
			},
			likes: {
				include: {
					user: { select: { username: true } },
				},
				orderBy: { createdAt: 'asc' },
			},
		},
		orderBy: { createdAt: 'asc' },
	})

	const likedSet = new Set(
		comments
			.flatMap((comment) => comment.likes)
			.filter((like) => like.userId === currentUser?.id)
			.map((like) => like.commentId),
	)
	const itemMap = new Map<string, MessageCommentItem>()

	comments.forEach((comment, index) => {
		const author = comment.author
		const username =
			author?.username ?? comment.authorHandleSnapshot ?? comment.githubLogin
		const displayName =
			author?.displayName ??
			comment.authorDisplayNameSnapshot ??
			comment.githubLogin
		const preferredIdentity =
			author?.identities.find(
				(identity) => identity.id === author.preferredAvatarIdentityId,
			) ?? author?.identities[0]
		const owns =
			comment.authorUserId === currentUser?.id ||
			(!comment.authorUserId &&
				currentUserOwnsLegacyLogin(currentUser, comment.githubLogin))

		itemMap.set(comment.id, {
			id: comment.id,
			floor: index + 1,
			parentId: comment.parentId,
			isPinned: comment.isPinned,
			content: comment.content,
			authorUserId: comment.authorUserId,
			username,
			displayName,
			avatarUrl:
				preferredIdentity?.avatarUrl ??
				comment.authorAvatarUrlSnapshot ??
				comment.avatarUrl,
			identities: author?.identities.map(mapIdentity) ?? [],
			createdAt: comment.createdAt.toISOString(),
			likeCount: comment.likes.length,
			hasLiked: likedSet.has(comment.id),
			likedByUsernames: comment.likes.map(
				(like) => like.user?.username ?? like.githubLogin,
			),
			canEdit: owns || currentUser?.isAdmin === true,
			canDelete: owns || currentUser?.isAdmin === true,
			canPin: currentUser?.isAdmin === true && comment.parentId === null,
			replyToUsername: null,
			replyToFloor: null,
			isNestedReply: false,
			replies: [],
		})
	})

	const roots: MessageCommentItem[] = []
	for (const item of itemMap.values()) {
		if (item.parentId && itemMap.has(item.parentId)) {
			itemMap.get(item.parentId)?.replies.push(item)
		} else {
			roots.push(item)
		}
	}

	const sortByCreatedAt = createCreatedAtSorter(options.sort)
	const walk = (items: MessageCommentItem[]) => {
		items.sort(sortByCreatedAt)
		for (const item of items) walk(item.replies)
	}
	walk(roots)
	roots.sort(createRootSorter(options.sort))

	const flattenRepliesForRoot = (
		rootId: string,
		replyNodes: MessageCommentItem[],
	): MessageCommentItem[] => {
		const flattened: MessageCommentItem[] = []
		const visit = (node: MessageCommentItem) => {
			const parent = node.parentId ? itemMap.get(node.parentId) : null
			node.replyToUsername = parent?.username ?? null
			node.replyToFloor = parent?.floor ?? null
			node.isNestedReply = Boolean(node.parentId && node.parentId !== rootId)
			const nested = node.replies
			node.replies = []
			flattened.push(node)
			for (const child of nested) visit(child)
		}
		for (const reply of replyNodes) visit(reply)
		return flattened
	}

	for (const root of roots) {
		root.replyToUsername = null
		root.replyToFloor = null
		root.isNestedReply = false
		root.replies = flattenRepliesForRoot(root.id, root.replies)
	}

	const filteredRoots =
		options.pinFilter === 'pinned'
			? roots.filter((root) => root.isPinned)
			: options.pinFilter === 'unpinned'
				? roots.filter((root) => !root.isPinned)
				: roots
	const countCommentItems = (items: MessageCommentItem[]): number =>
		items.reduce(
			(total, item) => total + 1 + countCommentItems(item.replies),
			0,
		)
	const pinnedRoots = filteredRoots.filter((root) => root.isPinned)
	const unpinnedRoots = filteredRoots.filter((root) => !root.isPinned)
	const totalPages = Math.max(
		1,
		Math.ceil(unpinnedRoots.length / options.pageSize),
	)
	let requestedPage = options.page
	if (options.focusCommentId) {
		let focused = itemMap.get(options.focusCommentId)
		while (focused?.parentId && itemMap.has(focused.parentId)) {
			focused = itemMap.get(focused.parentId)
		}
		const focusedRootIndex = focused
			? unpinnedRoots.findIndex((root) => root.id === focused.id)
			: -1
		if (focusedRootIndex >= 0) {
			requestedPage = Math.floor(focusedRootIndex / options.pageSize) + 1
		}
	}
	const page = Math.min(Math.max(1, requestedPage), totalPages)
	const start = (page - 1) * options.pageSize

	return {
		items: [
			...pinnedRoots,
			...unpinnedRoots.slice(start, start + options.pageSize),
		],
		pagination: {
			page,
			pageSize: options.pageSize,
			totalPages,
			totalRootCount: filteredRoots.length,
			totalCommentCount: countCommentItems(filteredRoots),
			hasPrev: page > 1,
			hasNext: page < totalPages,
		},
	}
}

export const setMessageCommentPinned = async (
	commentId: string,
	pinned: boolean,
	currentUser: AuthUser,
) => {
	const comment = await prisma.messageComment.findUnique({
		where: { id: commentId },
		select: { id: true, parentId: true },
	})
	if (!comment) {
		throw createError({ statusCode: 404, statusMessage: 'COMMENT_NOT_FOUND' })
	}
	if (comment.parentId) {
		throw createError({
			statusCode: 400,
			statusMessage: 'COMMENT_PIN_ONLY_ROOT',
		})
	}
	await prisma.$transaction(async (tx) => {
		await tx.messageComment.update({
			where: { id: commentId },
			data: { isPinned: pinned },
		})
		await insertDomainEvent(
			tx,
			DOMAIN_EVENT_NAMES.COMMENT_PIN_CHANGED,
			commentId,
			{ commentId, actorUserId: currentUser.id, pinned },
		)
	})
}

export const createMessageComment = async (
	currentUser: AuthUser,
	content: string,
	parentId?: string | null,
) => {
	if (parentId) {
		const parent = await prisma.messageComment.findUnique({
			where: { id: parentId },
			select: { id: true },
		})
		if (!parent) {
			throw createError({
				statusCode: 404,
				statusMessage: 'COMMENT_PARENT_NOT_FOUND',
			})
		}
	}

	const legacy = getLegacySnapshot(currentUser)
	const comment = await prisma.$transaction(async (tx) => {
		const created = await tx.messageComment.create({
			data: {
				parentId: parentId ?? null,
				content,
				githubLogin: legacy.legacyLogin,
				avatarUrl: legacy.avatarUrl,
				profileUrl: legacy.profileUrl,
				authorUserId: currentUser.id,
				authorHandleSnapshot: currentUser.username,
				authorDisplayNameSnapshot: currentUser.displayName,
				authorAvatarUrlSnapshot: currentUser.avatarUrl,
			},
		})
		await insertDomainEvent(
			tx,
			DOMAIN_EVENT_NAMES.COMMENT_CREATED,
			created.id,
			{
				commentId: created.id,
				parentId: created.parentId,
				authorUserId: currentUser.id,
			},
		)
		return created
	})

	socialEventBus.emit(SOCIAL_EVENT_NAMES.COMMENT_CREATED, {
		commentId: comment.id,
		parentId: comment.parentId,
		authorUserId: currentUser.id,
		authorUsername: currentUser.username,
		avatarUrl: comment.avatarUrl,
		content: comment.content,
		createdAt: comment.createdAt.toISOString(),
	})
}

export const toggleMessageCommentLike = async (
	commentId: string,
	currentUser: AuthUser,
) => {
	const comment = await prisma.messageComment.findUnique({
		where: { id: commentId },
		select: { id: true },
	})
	if (!comment) {
		throw createError({ statusCode: 404, statusMessage: 'COMMENT_NOT_FOUND' })
	}
	const existingLike = await prisma.messageCommentLike.findUnique({
		where: { commentId_userId: { commentId, userId: currentUser.id } },
	})
	const legacyLogin = getLegacySnapshot(currentUser).legacyLogin

	if (existingLike) {
		await prisma.$transaction(async (tx) => {
			await tx.messageCommentLike.delete({ where: { id: existingLike.id } })
			await insertDomainEvent(
				tx,
				DOMAIN_EVENT_NAMES.COMMENT_UNLIKED,
				commentId,
				{
					commentId,
					commentLikeId: existingLike.id,
					actorUserId: currentUser.id,
				},
			)
		})
		socialEventBus.emit(SOCIAL_EVENT_NAMES.COMMENT_UNLIKED, {
			commentLikeId: existingLike.id,
			commentId,
			actorUserId: currentUser.id,
			actorUsername: currentUser.username,
			removedAt: new Date().toISOString(),
		})
		return
	}

	try {
		const like = await prisma.$transaction(async (tx) => {
			const created = await tx.messageCommentLike.create({
				data: {
					commentId,
					userId: currentUser.id,
					githubLogin: legacyLogin,
				},
			})
			await insertDomainEvent(tx, DOMAIN_EVENT_NAMES.COMMENT_LIKED, commentId, {
				commentId,
				commentLikeId: created.id,
				actorUserId: currentUser.id,
			})
			return created
		})
		socialEventBus.emit(SOCIAL_EVENT_NAMES.COMMENT_LIKED, {
			commentLikeId: like.id,
			commentId,
			actorUserId: currentUser.id,
			actorUsername: currentUser.username,
			createdAt: like.createdAt.toISOString(),
		})
	} catch (error) {
		if (!isUniqueConstraintError(error)) throw error
	}
}

export const updateMessageComment = async (
	commentId: string,
	content: string,
	currentUser: AuthUser,
) => {
	const comment = await prisma.messageComment.findUnique({
		where: { id: commentId },
		select: { id: true, authorUserId: true, githubLogin: true },
	})
	if (!comment) {
		throw createError({ statusCode: 404, statusMessage: 'COMMENT_NOT_FOUND' })
	}
	const owns =
		comment.authorUserId === currentUser.id ||
		(!comment.authorUserId &&
			currentUserOwnsLegacyLogin(currentUser, comment.githubLogin))
	if (!owns && !currentUser.isAdmin) {
		throw createError({
			statusCode: 403,
			statusMessage: 'COMMENT_EDIT_FORBIDDEN',
		})
	}
	const updated = await prisma.$transaction(async (tx) => {
		const result = await tx.messageComment.update({
			where: { id: commentId },
			data: { content },
		})
		await insertDomainEvent(tx, DOMAIN_EVENT_NAMES.COMMENT_UPDATED, commentId, {
			commentId,
			actorUserId: currentUser.id,
		})
		return result
	})
	socialEventBus.emit(SOCIAL_EVENT_NAMES.COMMENT_UPDATED, {
		commentId: updated.id,
		actorUserId: currentUser.id,
		actorUsername: currentUser.username,
		content: updated.content,
		updatedAt: updated.updatedAt.toISOString(),
	})
}

export const deleteMessageComment = async (
	commentId: string,
	currentUser: AuthUser,
) => {
	const comment = await prisma.messageComment.findUnique({
		where: { id: commentId },
		select: { id: true, authorUserId: true, githubLogin: true },
	})
	if (!comment) {
		throw createError({ statusCode: 404, statusMessage: 'COMMENT_NOT_FOUND' })
	}
	const owns =
		comment.authorUserId === currentUser.id ||
		(!comment.authorUserId &&
			currentUserOwnsLegacyLogin(currentUser, comment.githubLogin))
	if (!owns && !currentUser.isAdmin) {
		throw createError({
			statusCode: 403,
			statusMessage: 'COMMENT_DELETE_FORBIDDEN',
		})
	}
	await prisma.$transaction(async (tx) => {
		await tx.messageComment.delete({ where: { id: commentId } })
		await insertDomainEvent(tx, DOMAIN_EVENT_NAMES.COMMENT_DELETED, commentId, {
			commentId,
			actorUserId: currentUser.id,
		})
	})
	socialEventBus.emit(SOCIAL_EVENT_NAMES.COMMENT_DELETED, {
		commentId,
		actorUserId: currentUser.id,
		actorUsername: currentUser.username,
		deletedAt: new Date().toISOString(),
	})
}
