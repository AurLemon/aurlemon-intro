<template>
	<main
		class="flex min-h-screen items-center justify-center bg-slate-50 px-5 text-slate-800 dark:bg-slate-950 dark:text-slate-100"
	>
		<section
			class="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
			aria-labelledby="oauth-progress-title"
			aria-busy="true"
		>
			<div class="flex items-start gap-4">
				<span
					class="mt-1 inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800"
					aria-hidden="true"
				>
					<span
						class="size-5 animate-spin rounded-full border-2 border-primary-600 border-r-transparent dark:border-primary-300 dark:border-r-transparent"
					/>
				</span>
				<div class="min-w-0 flex-1">
					<h1 id="oauth-progress-title" class="text-base font-semibold">
						{{ t('social.oauthProgress.title') }}
					</h1>
					<p
						class="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300"
						role="status"
						aria-live="polite"
					>
						{{ statusMessage }}
					</p>
				</div>
			</div>
		</section>
	</main>
</template>

<script setup lang="ts">
import type { OAuthProgressSnapshot } from '~/server/utils/oauth-progress'

definePageMeta({ layout: false })
useHead({ meta: [{ name: 'referrer', content: 'no-referrer' }] })

const { t } = useI18n({ useScope: 'global' })
const route = useRoute()
const statusMessage = ref(t('social.oauthProgress.received'))

const delay = (ms: number): Promise<void> =>
	new Promise((resolve) => setTimeout(resolve, ms))

const redirectToError = (code: string): void => {
	const query = new URLSearchParams({ authError: code })
	const localePrefix = route.path.match(/^\/(en-US|ja-JP)(?:\/|$)/)?.[0] ?? ''
	window.location.replace(`${localePrefix}/?${query.toString()}`)
}

const applyProgressUpdate = (
	update: OAuthProgressSnapshot['updates'][number],
): void => {
	const message =
		update.key === 'retrying'
			? t('social.oauthProgress.retrying', {
					attempt: update.attempt ?? 2,
					totalAttempts: update.totalAttempts ?? 3,
				})
			: t(`social.oauthProgress.${update.key}`)
	statusMessage.value = message
}

onMounted(async () => {
	const flowId = typeof route.query.flow === 'string' ? route.query.flow : ''
	if (!flowId) {
		statusMessage.value = t('social.oauthProgress.failed')
		redirectToError('INVALID_OAUTH_STATE')
		return
	}
	const currentUrl = new URL(window.location.href)
	currentUrl.searchParams.delete('flow')
	window.history.replaceState(window.history.state, '', currentUrl)

	let redirectPath: string | undefined
	let submitFinished = false
	let submitError = false
	let submissionCount = 0
	const submitProcess = async (): Promise<void> => {
		submitFinished = false
		submissionCount += 1
		try {
			const result = await $fetch<{ redirectPath?: string }>(
				'/api/auth/github/process',
				{ method: 'POST', body: { flowId } },
			)
			redirectPath = result.redirectPath ?? redirectPath
			submitError = false
		} catch {
			submitError = true
		} finally {
			submitFinished = true
		}
	}
	void submitProcess()

	let updateCount = 0
	let progressStatus: OAuthProgressSnapshot['status'] = 'pending'
	let progressErrorCode: string | undefined
	const deadline = Date.now() + 90_000
	while (
		!redirectPath &&
		progressStatus !== 'failed' &&
		Date.now() < deadline
	) {
		try {
			const snapshot = await $fetch<OAuthProgressSnapshot>(
				`/api/auth/github/progress?flow=${encodeURIComponent(flowId)}`,
				{ cache: 'no-store' },
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
			submitFinished &&
			!redirectPath &&
			(progressStatus === 'completed' ||
				(submitError && progressStatus === 'pending')) &&
			submissionCount < 2
		) {
			void submitProcess()
		}
		if (
			submitFinished &&
			!redirectPath &&
			submissionCount >= 2 &&
			(progressStatus === 'completed' ||
				(submitError && progressStatus === 'pending'))
		) {
			progressStatus = 'failed'
			progressErrorCode ??= 'GITHUB_OAUTH_CALLBACK_FAILED'
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
				? 'GITHUB_OAUTH_CALLBACK_FAILED'
				: 'INVALID_OAUTH_STATE'),
	)
})
</script>
