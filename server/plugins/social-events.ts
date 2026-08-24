import {
	SOCIAL_EVENT_NAMES,
	socialEventBus,
} from '~/server/utils/social-events'

declare global {
	var __socialListenersReady__: boolean | undefined
}

export default defineNitroPlugin(() => {
	if (globalThis.__socialListenersReady__) {
		return
	}

	globalThis.__socialListenersReady__ = true

	socialEventBus.on(
		SOCIAL_EVENT_NAMES.FRIEND_LINK_APPLICATION_SUBMITTED,
		(payload) => {
			console.info(
				`[friend-link] application submitted id=${payload.applicationId} applicant=${payload.applicantUsername} name=${payload.name}`,
			)
		},
	)

	socialEventBus.on(
		SOCIAL_EVENT_NAMES.FRIEND_LINK_APPLICATION_REJECTED,
		(payload) => {
			console.info(
				`[friend-link] application rejected id=${payload.applicationId} by=${payload.rejectedByUsername}`,
			)
		},
	)

	socialEventBus.on(
		SOCIAL_EVENT_NAMES.FRIEND_LINK_APPLICATION_EXPIRED,
		(payload) => {
			console.info(
				`[friend-link] application expired id=${payload.applicationId} at=${payload.expiredAt}`,
			)
		},
	)
})
