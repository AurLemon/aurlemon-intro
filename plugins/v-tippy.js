import VTippy from 'v-tippy'
import 'v-tippy/dist/tippy.css'

export default defineNuxtPlugin((nuxtApp) => {
    nuxtApp.vueApp.use(VTippy, {
        directive: 'tippy',
        defaultProps: {
            placement: 'auto-end',
            allowHTML: true,
            theme: 'light'
        }
    })
})