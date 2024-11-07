import VueClipboard from 'v-clipboard'

export default defineNuxtPlugin((nuxtApp) => {
    nuxtApp.vueApp.use(VueClipboard)
})