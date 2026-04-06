// plugins/clarity

import Clarity from '@microsoft/clarity'

declare global {
	interface Window {
		clarity: typeof Clarity
	}
}

export default defineNuxtPlugin(() => {
	const clarityProjectId = process.env.MS_CLARITY_ID

	if (clarityProjectId) {
		Clarity.init(clarityProjectId)
	}
})
