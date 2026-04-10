// plugins/clarity

import Clarity from '@microsoft/clarity'

declare global {
	interface Window {
		clarity: typeof Clarity
	}
}

export default defineNuxtPlugin(() => {
	if (import.meta.dev) {
		return
	}

	const clarityProjectId = useRuntimeConfig().public.msClarityId

	if (clarityProjectId) {
		Clarity.init(clarityProjectId)
	}
})
