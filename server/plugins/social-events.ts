import { materializeApprovedFriendLink } from '~/server/services/friend-link.service'
import {
	SOCIAL_EVENT_NAMES,
	socialEventBus,
} from '~/server/utils/social-events'

declare global {
	// eslint-disable-next-line no-var
	var __socialListenersReady__: boolean | undefined
}

export default defineNitroPlugin(() => {
	if (globalThis.__socialListenersReady__) {
		return
	}

	globalThis.__socialListenersReady__ = true

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
