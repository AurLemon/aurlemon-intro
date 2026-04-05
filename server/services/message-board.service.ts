import prisma from '~/lib/prisma'
import {
	SOCIAL_EVENT_NAMES,
	socialEventBus,
} from '~/server/utils/social-events'
import type {
	GithubAuthUser,
	MessageBoardPagination,
	MessageCommentItem,
} from '~/shared/types/social'
import type { MessageBoardPaginationQuery } from '~/server/utils/message-board-pagination'

const sortComments = (a: MessageCommentItem, b: MessageCommentItem) =>
	new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()

export const listMessageBoard = async (
	currentUser: GithubAuthUser | null,
	options: MessageBoardPaginationQuery,
): Promise<{
	items: MessageCommentItem[]
	pagination: MessageBoardPagination
}> => {
	const comments = await prisma.messageComment.findMany({
		include: {
			likes: true,
		},
		orderBy: {
			createdAt: 'asc',
		},
	})

	const likedSet = new Set(
		comments
			.flatMap((comment) => comment.likes)
			.filter((like) => like.githubLogin === currentUser?.githubLogin)
			.map((like) => like.commentId),
	)

	const itemMap = new Map<string, MessageCommentItem>()

	comments.forEach((comment, index) => {
		itemMap.set(comment.id, {
			id: comment.id,
			floor: index + 1,
			parentId: comment.parentId,
			content: comment.content,
			githubLogin: comment.githubLogin,
			avatarUrl: comment.avatarUrl,
			profileUrl: comment.profileUrl,
			createdAt: comment.createdAt.toISOString(),
			likeCount: comment.likes.length,
			hasLiked: likedSet.has(comment.id),
			canEdit:
				comment.githubLogin === currentUser?.githubLogin ||
				currentUser?.isAdmin === true,
			canDelete:
				comment.githubLogin === currentUser?.githubLogin ||
				currentUser?.isAdmin === true,
			replyToGithubLogin: null,
			isNestedReply: false,
			replies: [],
		})
	})

	const roots: MessageCommentItem[] = []

	for (const item of itemMap.values()) {
		if (item.parentId && itemMap.has(item.parentId)) {
			itemMap.get(item.parentId)?.replies.push(item)
			continue
		}

		roots.push(item)
	}

	const walk = (items: MessageCommentItem[]) => {
		items.sort(sortComments)
		for (const item of items) {
			walk(item.replies)
		}
	}

	walk(roots)

	const flattenRepliesForRoot = (
		rootId: string,
		replyNodes: MessageCommentItem[],
	): MessageCommentItem[] => {
		const flattened: MessageCommentItem[] = []

		const visit = (node: MessageCommentItem) => {
			const parent = node.parentId ? itemMap.get(node.parentId) : null
			node.replyToGithubLogin = parent?.githubLogin ?? null
			node.isNestedReply = Boolean(node.parentId && node.parentId !== rootId)
			const nested = node.replies
			node.replies = []
			flattened.push(node)

			for (const child of nested) {
				visit(child)
			}
		}

		for (const reply of replyNodes) {
			visit(reply)
		}

		return flattened
	}

	for (const root of roots) {
		root.replyToGithubLogin = null
		root.isNestedReply = false
		root.replies = flattenRepliesForRoot(root.id, root.replies)
	}

	const totalRootCount = roots.length
	const totalCommentCount = comments.length
	const totalPages = Math.max(1, Math.ceil(totalRootCount / options.pageSize))
	const page = Math.min(Math.max(1, options.page), totalPages)
	const start = (page - 1) * options.pageSize
	const items = roots.slice(start, start + options.pageSize)

	return {
		items,
		pagination: {
			page,
			pageSize: options.pageSize,
			totalPages,
			totalRootCount,
			totalCommentCount,
			hasPrev: page > 1,
			hasNext: page < totalPages,
		},
	}
}

export const createMessageComment = async (
	currentUser: GithubAuthUser,
	content: string,
	parentId?: string | null,
) => {
	if (parentId) {
		const parent = await prisma.messageComment.findUnique({
			where: {
				id: parentId,
			},
			select: {
				id: true,
			},
		})

		if (!parent) {
			throw createError({
				statusCode: 404,
				statusMessage: 'COMMENT_PARENT_NOT_FOUND',
			})
		}
	}

	const comment = await prisma.messageComment.create({
		data: {
			parentId: parentId ?? null,
			content,
			githubLogin: currentUser.githubLogin,
			avatarUrl: currentUser.avatarUrl,
			profileUrl: currentUser.profileUrl,
		},
	})

	socialEventBus.emit(SOCIAL_EVENT_NAMES.COMMENT_CREATED, {
		commentId: comment.id,
		parentId: comment.parentId,
		githubLogin: comment.githubLogin,
		avatarUrl: comment.avatarUrl,
		profileUrl: comment.profileUrl,
		content: comment.content,
		createdAt: comment.createdAt.toISOString(),
	})
}

export const likeMessageComment = async (
	commentId: string,
	currentUser: GithubAuthUser,
) => {
	const comment = await prisma.messageComment.findUnique({
		where: {
			id: commentId,
		},
		select: {
			id: true,
		},
	})

	if (!comment) {
		throw createError({
			statusCode: 404,
			statusMessage: 'COMMENT_NOT_FOUND',
		})
	}

	const existingLike = await prisma.messageCommentLike.findUnique({
		where: {
			commentId_githubLogin: {
				commentId,
				githubLogin: currentUser.githubLogin,
			},
		},
	})

	if (existingLike) {
		throw createError({
			statusCode: 409,
			statusMessage: 'COMMENT_ALREADY_LIKED',
		})
	}

	const commentLike = await prisma.messageCommentLike.create({
		data: {
			commentId,
			githubLogin: currentUser.githubLogin,
		},
	})

	socialEventBus.emit(SOCIAL_EVENT_NAMES.COMMENT_LIKED, {
		commentLikeId: commentLike.id,
		commentId,
		githubLogin: currentUser.githubLogin,
		createdAt: commentLike.createdAt.toISOString(),
	})
}

export const updateMessageComment = async (
	commentId: string,
	content: string,
	currentUser: GithubAuthUser,
) => {
	const comment = await prisma.messageComment.findUnique({
		where: {
			id: commentId,
		},
		select: {
			id: true,
			githubLogin: true,
		},
	})

	if (!comment) {
		throw createError({
			statusCode: 404,
			statusMessage: 'COMMENT_NOT_FOUND',
		})
	}

	if (comment.githubLogin !== currentUser.githubLogin && !currentUser.isAdmin) {
		throw createError({
			statusCode: 403,
			statusMessage: 'COMMENT_EDIT_FORBIDDEN',
		})
	}

	const updated = await prisma.messageComment.update({
		where: {
			id: commentId,
		},
		data: {
			content,
		},
	})

	socialEventBus.emit(SOCIAL_EVENT_NAMES.COMMENT_UPDATED, {
		commentId: updated.id,
		githubLogin: updated.githubLogin,
		content: updated.content,
		updatedAt: updated.updatedAt.toISOString(),
	})
}

export const deleteMessageComment = async (
	commentId: string,
	currentUser: GithubAuthUser,
) => {
	const comment = await prisma.messageComment.findUnique({
		where: {
			id: commentId,
		},
		select: {
			id: true,
			githubLogin: true,
		},
	})

	if (!comment) {
		throw createError({
			statusCode: 404,
			statusMessage: 'COMMENT_NOT_FOUND',
		})
	}

	if (comment.githubLogin !== currentUser.githubLogin && !currentUser.isAdmin) {
		throw createError({
			statusCode: 403,
			statusMessage: 'COMMENT_DELETE_FORBIDDEN',
		})
	}

	await prisma.messageComment.delete({
		where: {
			id: commentId,
		},
	})

	socialEventBus.emit(SOCIAL_EVENT_NAMES.COMMENT_DELETED, {
		commentId,
		githubLogin: currentUser.githubLogin,
		deletedAt: new Date().toISOString(),
	})
}
