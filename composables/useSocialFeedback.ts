const ERROR_KEY_MAP: Record<string, string> = {
	AUTH_REQUIRED: 'social.errors.authRequired',
	ADMIN_REQUIRED: 'social.errors.adminRequired',
	SITE_ALREADY_LIKED: 'social.errors.siteAlreadyLiked',
	COMMENT_ALREADY_LIKED: 'social.errors.commentAlreadyLiked',
	COMMENT_EDIT_FORBIDDEN: 'social.errors.commentEditForbidden',
	COMMENT_DELETE_FORBIDDEN: 'social.errors.commentDeleteForbidden',
	COMMENT_NOT_FOUND: 'social.errors.commentNotFound',
	COMMENT_PARENT_NOT_FOUND: 'social.errors.commentParentNotFound',
	FRIEND_LINK_ALREADY_EXISTS: 'social.errors.friendLinkAlreadyExists',
	FRIEND_LINK_NOT_FOUND: 'social.errors.friendLinkNotFound',
	FRIEND_LINK_APPLICATION_PENDING: 'social.errors.friendLinkApplicationPending',
	FRIEND_LINK_APPLICATION_NOT_FOUND:
		'social.errors.friendLinkApplicationNotFound',
	INVALID_GITHUB_OAUTH_STATE: 'social.errors.invalidGithubOauthState',
	INVALID_COMMENT_CONTENT: 'social.errors.invalidCommentContent',
	INVALID_FRIEND_LINK_NAME: 'social.errors.invalidFriendLinkName',
	INVALID_FRIEND_LINK_URL: 'social.errors.invalidFriendLinkUrl',
	INVALID_FRIEND_LINK_DESC: 'social.errors.invalidFriendLinkDesc',
	INVALID_IMAGE_BASE64: 'social.errors.invalidImageBase64',
	IMAGE_TOO_LARGE: 'social.errors.imageTooLarge',
	INVALID_FINGERPRINT: 'social.errors.invalidFingerprint',
}

export const resolveSocialErrorKey = (error: unknown): string => {
	const statusMessage =
		typeof error === 'object' &&
		error &&
		'data' in error &&
		typeof error.data === 'object' &&
		error.data &&
		'statusMessage' in error.data &&
		typeof error.data.statusMessage === 'string'
			? error.data.statusMessage
			: typeof error === 'object' &&
				  error &&
				  'statusMessage' in error &&
				  typeof error.statusMessage === 'string'
				? error.statusMessage
				: ''

	return ERROR_KEY_MAP[statusMessage] ?? 'social.errors.generic'
}

export const useSocialFeedback = () => {
	const toast = useToast()
	const { t } = useI18n()

	const notify = (
		titleKey: string,
		descriptionKey: string,
		color: 'warning' | 'error' = 'error',
	) => {
		toast.add({
			title: t(titleKey),
			description: t(descriptionKey),
			color,
			icon:
				color === 'warning'
					? 'i-lucide-triangle-alert'
					: 'i-lucide-circle-alert',
		})
	}

	const showAuthRequired = () => {
		notify('social.feedback.authTitle', 'social.errors.authRequired', 'warning')
	}

	const showSessionExpired = () => {
		notify(
			'social.feedback.authTitle',
			'social.errors.sessionExpired',
			'warning',
		)
	}

	const showError = (error: unknown) => {
		const descriptionKey = resolveSocialErrorKey(error)
		notify('social.feedback.errorTitle', descriptionKey, 'error')
	}

	return {
		showAuthRequired,
		showSessionExpired,
		showError,
	}
}
