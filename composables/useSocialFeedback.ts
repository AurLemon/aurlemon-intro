const ERROR_KEY_MAP: Record<string, string> = {
	AUTH_REQUIRED: 'social.errors.authRequired',
	ADMIN_REQUIRED: 'social.errors.adminRequired',
	SITE_ALREADY_LIKED: 'social.errors.siteAlreadyLiked',
	COMMENT_ALREADY_LIKED: 'social.errors.commentAlreadyLiked',
	COMMENT_EDIT_FORBIDDEN: 'social.errors.commentEditForbidden',
	COMMENT_DELETE_FORBIDDEN: 'social.errors.commentDeleteForbidden',
	COMMENT_NOT_FOUND: 'social.errors.commentNotFound',
	COMMENT_PARENT_NOT_FOUND: 'social.errors.commentParentNotFound',
	COMMENT_PIN_ONLY_ROOT: 'social.errors.commentPinOnlyRoot',
	INVALID_COMMENT_PINNED_STATE: 'social.errors.invalidCommentPinnedState',
	FRIEND_LINK_ALREADY_EXISTS: 'social.errors.friendLinkAlreadyExists',
	FRIEND_LINK_NOT_FOUND: 'social.errors.friendLinkNotFound',
	FRIEND_LINK_APPLICATION_PENDING: 'social.errors.friendLinkApplicationPending',
	FRIEND_LINK_APPLICATION_NOT_FOUND:
		'social.errors.friendLinkApplicationNotFound',
	INVALID_GITHUB_OAUTH_STATE: 'social.errors.invalidGithubOauthState',
	GITHUB_OAUTH_NOT_CONFIGURED: 'social.errors.githubOauthNotConfigured',
	GITHUB_OAUTH_NETWORK_ERROR: 'social.errors.githubOauthNetworkError',
	GITHUB_OAUTH_PROVIDER_ERROR: 'social.errors.githubOauthProviderError',
	GITHUB_OAUTH_TOKEN_EXCHANGE_FAILED:
		'social.errors.githubOauthTokenExchangeFailed',
	GITHUB_OAUTH_USER_PAYLOAD_INVALID:
		'social.errors.githubOauthUserPayloadInvalid',
	GITHUB_OAUTH_CALLBACK_FAILED: 'social.errors.githubOauthCallbackFailed',
	'GitHub OAuth is not configured.': 'social.errors.githubOauthNotConfigured',
	'GitHub OAuth token exchange failed.':
		'social.errors.githubOauthTokenExchangeFailed',
	'GitHub OAuth user payload is invalid.':
		'social.errors.githubOauthUserPayloadInvalid',
	INVALID_COMMENT_CONTENT: 'social.errors.invalidCommentContent',
	INVALID_FRIEND_LINK_NAME: 'social.errors.invalidFriendLinkName',
	INVALID_FRIEND_LINK_URL: 'social.errors.invalidFriendLinkUrl',
	INVALID_FRIEND_LINK_DESC: 'social.errors.invalidFriendLinkDesc',
	INVALID_IMAGE_BASE64: 'social.errors.invalidImageBase64',
	IMAGE_TOO_LARGE: 'social.errors.imageTooLarge',
	INVALID_FINGERPRINT: 'social.errors.invalidFingerprint',
	INVALID_OAUTH_STATE: 'social.errors.invalidOauthState',
	LINUX_DO_OAUTH_NOT_CONFIGURED: 'social.errors.linuxDoOauthNotConfigured',
	LINUX_DO_OAUTH_TOKEN_EXCHANGE_FAILED:
		'social.errors.linuxDoOauthTokenExchangeFailed',
	LINUX_DO_OAUTH_USER_PAYLOAD_INVALID:
		'social.errors.linuxDoOauthUserPayloadInvalid',
	LINUX_DO_OAUTH_CALLBACK_FAILED: 'social.errors.linuxDoOauthCallbackFailed',
	OAUTH_CONNECT_SESSION_CHANGED: 'social.errors.oauthConnectSessionChanged',
	IDENTITY_PROVIDER_ALREADY_CONNECTED:
		'social.errors.identityProviderAlreadyConnected',
	INVALID_USERNAME: 'social.errors.invalidUsername',
	INVALID_USER_DISPLAY_NAME: 'social.errors.invalidUserDisplayName',
	USERNAME_TAKEN: 'social.errors.usernameTaken',
	USERNAME_CHANGE_COOLDOWN: 'social.errors.usernameChangeCooldown',
	INVALID_AVATAR_IDENTITY: 'social.errors.invalidAvatarIdentity',
	VERIFIED_PRIMARY_EMAIL_REQUIRED: 'social.errors.verifiedPrimaryEmailRequired',
	INVALID_EMAIL: 'social.errors.invalidEmail',
	EMAIL_ALREADY_IN_USE: 'social.errors.emailAlreadyInUse',
	EMAIL_VERIFICATION_RATE_LIMITED: 'social.errors.emailVerificationRateLimited',
	EMAIL_VERIFICATION_INVALID: 'social.errors.emailVerificationInvalid',
	EMAIL_NOT_FOUND: 'social.errors.emailNotFound',
	LAST_IDENTITY_CANNOT_DISCONNECT: 'social.errors.lastIdentityCannotDisconnect',
	IDENTITY_NOT_FOUND: 'social.errors.identityNotFound',
	MERGE_TICKET_INVALID: 'social.errors.mergeTicketInvalid',
	MERGE_ACCOUNT_NOT_FOUND: 'social.errors.mergeAccountNotFound',
	MERGE_PROVIDER_CONFLICT: 'social.errors.mergeProviderConflict',
	INVALID_OAUTH_PROVIDER: 'social.errors.invalidOauthProvider',
	SITE_URL_NOT_CONFIGURED: 'social.errors.siteUrlNotConfigured',
	ACCOUNT_DISABLED: 'social.errors.accountDisabled',
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
	const { t } = useI18n({ useScope: 'global' })

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
