import { materializeApprovedFriendLink } from '~/server/services/friend-link.service'
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
				`[friend-link] application submitted id=${payload.applicationId} applicant=${payload.applicantGithubLogin} name=${payload.name}`,
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

	socialEventBus.on(
		SOCIAL_EVENT_NAMES.FRIEND_LINK_APPLICATION_APPROVED,
		async (payload) => {
			await materializeApprovedFriendLink(
				payload.applicationId,
				payload.approvedByGithubLogin,
			)
		},
	)
})
