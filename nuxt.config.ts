// https://nuxt.com/docs/api/configuration/nuxt-config

export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  ssr: true,
  devtools: { enabled: false },
  plugins: [
    '~/plugins/v-tippy.js',
    '~/plugins/v-clipboard.js'
  ],
  modules: [
    '@pinia/nuxt',
    '@vesp/nuxt-fontawesome'
  ],
  fontawesome: {
    component: 'fa',
    icons: {
      solid: ['faCode', 'faLaptopCode', 'faMicrochip', 'faNetworkWired', 'faRobot', 'faDatabase', 'faPenNib'],
      brands: ['faGithub', 'faLinkedin', 'faNode', 'faVuejs'],
    },
  },
  css: [
    '~/assets/styles/global.scss',
    'material-icons/iconfont/material-icons.css'
  ],
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler'
        }
      }
    }
  }
})