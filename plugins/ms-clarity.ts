// plugins/clarity

import Clarity from '@microsoft/clarity'

declare global {
    interface Window {
        clarity: typeof Clarity
    }
}

export default defineNuxtPlugin(nuxtApp => {
    const clarityProjectId = process.env.MICROSOFT_CLARITY_KEY

    if (clarityProjectId) {
        Clarity.init(clarityProjectId)
    }
})
