// plugins/clarity

import Clarity from '@microsoft/clarity'

declare global {
	interface Window {
		clarity: typeof Clarity
	}
}

export default defineNuxtPlugin(() => {
	const clarityProjectId = useRuntimeConfig().public.msClarityId

	if (clarityProjectId) {
		Clarity.init(clarityProjectId)
	}
})
