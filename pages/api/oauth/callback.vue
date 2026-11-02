<template>
	<OAuthProgressView
		:provider="provider"
		:message="isPreview ? previewMessage : statusMessage"
	/>
</template>

<script setup lang="ts">
import { OAUTH_PROCESS_TIMEOUT_MS } from '~/shared/utils/oauth'
import type { OAuthProgressSnapshot } from '~/server/utils/oauth-progress'

definePageMeta({ layout: false })
useHead({ meta: [{ name: 'referrer', content: 'no-referrer' }] })

const { t, te } = useI18n({ useScope: 'global' })
const route = useRoute()
const provider = computed(() =>
	route.query.provider === 'linuxdo' ? 'linuxdo' : 'github',
)
const providerName = computed(() =>
	provider.value === 'linuxdo' ? 'Linux DO' : 'GitHub',
)
const callbackError = computed(() =>
	provider.value === 'linuxdo'
		? 'LINUX_DO_OAUTH_CALLBACK_FAILED'
		: 'GITHUB_OAUTH_CALLBACK_FAILED',
)
const statusMessage = ref(t('social.oauthProgress.received'))
const isPreview = computed(() => import.meta.dev && route.query.preview === '1')
const previewMessage = computed(() => {
	const stage =
		typeof route.query.stage === 'string' ? route.query.stage : 'tokenStarted'
	const key = `social.oauthProgress.${stage}`
	return te(key)
		? t(key, { provider: providerName.value, attempt: 2, totalAttempts: 3 })
		: t('social.oauthProgress.received')
})

const delay = (ms: number): Promise<void> =>
	new Promise((resolve) => setTimeout(resolve, ms))

const redirectToError = (code: string): void => {
	const query = new URLSearchParams({ authError: code })
	const localeMatch = route.path.match(/^\/(en-US|ja-JP)(?:\/|$)/)
	const localePrefix = localeMatch ? `/${localeMatch[1]}` : ''
	window.location.replace(`${localePrefix}/?${query.toString()}`)
}

const applyProgressUpdate = (
	update: OAuthProgressSnapshot['updates'][number],
): void => {
	const message =
		update.key === 'retrying'
			? t('social.oauthProgress.retrying', {
					provider: providerName.value,
					attempt: update.attempt ?? 2,
					totalAttempts: update.totalAttempts ?? 3,
				})
			: t(`social.oauthProgress.${update.key}`, {
					provider: providerName.value,
				})
	statusMessage.value = message
}

onMounted(async () => {
	// UI preview uses existing status copy without creating or submitting a login flow.
	if (isPreview.value) return

	const flowId = typeof route.query.flow === 'string' ? route.query.flow : ''
	if (!flowId) {
		statusMessage.value = t('social.oauthProgress.failed')
		redirectToError('INVALID_OAUTH_STATE')
		return
	}
	const currentUrl = new URL(window.location.href)
	currentUrl.searchParams.delete('flow')
	window.history.replaceState(window.history.state, '', currentUrl)

	const deadline = Date.now() + OAUTH_PROCESS_TIMEOUT_MS
	let redirectPath: string | undefined
	let activeSubmissions = 0
	let submitError = false
	let submissionCount = 0
	const submitProcess = async (): Promise<void> => {
		activeSubmissions += 1
		submissionCount += 1
		try {
			const result = await $fetch<{ redirectPath?: string }>(
				`/api/auth/${provider.value}/process`,
				{
					method: 'POST',
					body: { flowId },
					retry: 0,
					timeout: Math.max(1, deadline - Date.now()),
				},
			)
			redirectPath = result.redirectPath ?? redirectPath
			submitError = false
		} catch {
			submitError = true
		} finally {
			activeSubmissions -= 1
		}
	}
	void submitProcess()

	let updateCount = 0
	let progressStatus: OAuthProgressSnapshot['status'] = 'pending'
	let progressErrorCode: string | undefined
	while (
		!redirectPath &&
		progressStatus !== 'failed' &&
		Date.now() < deadline
	) {
		try {
			const snapshot = await $fetch<OAuthProgressSnapshot>(
				`/api/auth/${provider.value}/progress?flow=${encodeURIComponent(flowId)}`,
				{
					cache: 'no-store',
					retry: 0,
					timeout: Math.max(1, Math.min(5000, deadline - Date.now())),
				},
			)
			for (const update of snapshot.updates.slice(updateCount)) {
				applyProgressUpdate(update)
			}
			updateCount = snapshot.updates.length
			progressStatus = snapshot.status
			progressErrorCode = snapshot.errorCode
		} catch {
			// Keep polling while the server-side flow continues.
		}
		if (
			!redirectPath &&
			(progressStatus === 'completed' ||
				(submitError &&
					activeSubmissions === 0 &&
					progressStatus === 'pending')) &&
			submissionCount < 2
		) {
			void submitProcess()
		}
		if (
			activeSubmissions === 0 &&
			!redirectPath &&
			submissionCount >= 2 &&
			(progressStatus === 'completed' ||
				(submitError && progressStatus === 'pending'))
		) {
			progressStatus = 'failed'
			progressErrorCode ??= callbackError.value
		}
		if (!redirectPath && progressStatus !== 'failed' && Date.now() < deadline) {
			await delay(450)
		}
	}

	if (redirectPath) {
		window.location.replace(redirectPath)
		return
	}

	statusMessage.value = t('social.oauthProgress.failed')
	await delay(500)
	redirectToError(
		progressErrorCode ??
			(submitError || Date.now() >= deadline
				? callbackError.value
				: 'INVALID_OAUTH_STATE'),
	)
})
</script>
