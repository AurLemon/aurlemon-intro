import {
	BANGUMI_EVENT_NAMES,
	bangumiEventBus,
} from '~/server/utils/bangumi-events'
import {
	GITHUB_CONTRIBUTIONS_EVENT_NAMES,
	githubContributionsEventBus,
} from '~/server/utils/github-contributions-events'

const formatDuration = (durationMs: number): string => {
	return `${Math.max(0, Math.round(durationMs))}ms`
}

const formatBangumiCounts = (payload: {
	anime: { doing: number; wish: number; done: number }
	books: { doing: number; wish: number; done: number }
}): string => {
	return `anime=${payload.anime.doing}/${payload.anime.wish}/${payload.anime.done} books=${payload.books.doing}/${payload.books.wish}/${payload.books.done}`
}

declare global {
	var __dataRefreshLogListenersReady__: boolean | undefined
}

export default defineNitroPlugin(() => {
	if (globalThis.__dataRefreshLogListenersReady__) {
		return
	}

	globalThis.__dataRefreshLogListenersReady__ = true

	bangumiEventBus.on(BANGUMI_EVENT_NAMES.REFRESH_REQUESTED, (payload) => {
		console.info(
			`[bangumi] refresh start reason=${payload.reason} username=${payload.username}`,
		)
	})

	bangumiEventBus.on(BANGUMI_EVENT_NAMES.REFRESH_SUCCEEDED, (payload) => {
		console.info(
			`[bangumi] refresh ok reason=${payload.reason} username=${payload.username} duration=${formatDuration(payload.durationMs)} ${formatBangumiCounts(payload)}`,
		)
	})

	bangumiEventBus.on(BANGUMI_EVENT_NAMES.REFRESH_RETRIED, (payload) => {
		console.warn(
			`[bangumi] refresh retry reason=${payload.reason} username=${payload.username} attempt=${payload.attempt}/${payload.maxAttempts} duration=${formatDuration(payload.durationMs)} error=${payload.errorMessage}`,
		)
	})

	bangumiEventBus.on(BANGUMI_EVENT_NAMES.GROUP_FAILED, (payload) => {
		console.warn(
			`[bangumi] group failed reason=${payload.reason} username=${payload.username} label=${payload.label} error=${payload.errorMessage}`,
		)
	})

	bangumiEventBus.on(BANGUMI_EVENT_NAMES.REFRESH_FAILED, (payload) => {
		console.error(
			`[bangumi] refresh failed reason=${payload.reason} username=${payload.username} attempts=${payload.attempts} duration=${formatDuration(payload.durationMs)} error=${payload.finalErrorMessage}`,
		)
	})

	githubContributionsEventBus.on(
		GITHUB_CONTRIBUTIONS_EVENT_NAMES.REFRESH_REQUESTED,
		(payload) => {
			console.info(
				`[github-contributions] refresh start reason=${payload.reason} username=${payload.username} transport=${payload.transport}`,
			)
		},
	)

	githubContributionsEventBus.on(
		GITHUB_CONTRIBUTIONS_EVENT_NAMES.REFRESH_SUCCEEDED,
		(payload) => {
			console.info(
				`[github-contributions] refresh ok reason=${payload.reason} username=${payload.username} transport=${payload.transport} duration=${formatDuration(payload.durationMs)} total=${payload.totalContributions} weeks=${payload.weeks}`,
			)
		},
	)

	githubContributionsEventBus.on(
		GITHUB_CONTRIBUTIONS_EVENT_NAMES.REFRESH_FAILED,
		(payload) => {
			console.error(
				`[github-contributions] refresh failed reason=${payload.reason} username=${payload.username} transport=${payload.transport} duration=${formatDuration(payload.durationMs)} error=${payload.errorMessage}`,
			)
		},
	)
})
