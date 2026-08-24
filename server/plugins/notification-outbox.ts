import {
	closeEmailTransport,
	processDomainEvents,
	processEmailOutbox,
	resetInterruptedOutboxWork,
} from '~/server/services/notification-outbox.service'

declare global {
	var __notificationOutboxWorkerStarted__: boolean | undefined
	var __notificationOutboxTimer__: ReturnType<typeof setInterval> | undefined
}

export default defineNitroPlugin((nitroApp) => {
	if (import.meta.prerender) return
	if (globalThis.__notificationOutboxWorkerStarted__) return
	globalThis.__notificationOutboxWorkerStarted__ = true

	let running = false
	const tick = async () => {
		if (running) return
		running = true
		try {
			await processDomainEvents()
			await processEmailOutbox()
		} catch (error) {
			console.error('NOTIFICATION_OUTBOX_TICK_FAILED', error)
		} finally {
			running = false
		}
	}

	void resetInterruptedOutboxWork().then(tick)
	globalThis.__notificationOutboxTimer__ = setInterval(
		() => void tick(),
		15_000,
	)

	nitroApp.hooks.hook('close', async () => {
		if (globalThis.__notificationOutboxTimer__) {
			clearInterval(globalThis.__notificationOutboxTimer__)
			globalThis.__notificationOutboxTimer__ = undefined
		}
		globalThis.__notificationOutboxWorkerStarted__ = false
		await closeEmailTransport()
	})
})
