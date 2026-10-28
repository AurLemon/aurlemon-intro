import {
	processFriendLinkCovers,
	startFriendLinkCoverWorker,
	stopFriendLinkCoverWorker,
} from '~/server/services/friend-link-cover.service'

export default defineNitroPlugin((nitroApp) => {
	if (import.meta.prerender) return
	startFriendLinkCoverWorker()
	const tick = () =>
		void processFriendLinkCovers().catch((error) =>
			console.error('FRIEND_LINK_COVER_WORKER_FAILED', error),
		)
	const timer = setInterval(tick, 60_000)
	timer.unref()
	// Startup waits for the next tick; importing the server does not launch a browser.
	nitroApp.hooks.hook('close', async () => {
		clearInterval(timer)
		await stopFriendLinkCoverWorker()
	})
})
