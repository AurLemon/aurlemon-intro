// https://nuxt.com/docs/api/configuration/nuxt-config

export default defineNuxtConfig({
  compatibilityDate: "2024-04-03",
  ssr: true,
  devtools: { enabled: false },
  plugins: [
    "~/plugins/floating-vue.ts",
    "~/plugins/v-clipboard.ts",
  ],
  modules: ["@pinia/nuxt", "@vesp/nuxt-fontawesome"],
  fontawesome: {
    component: "fa",
    icons: {
      solid: [
        "faCode",
        "faLaptopCode",
        "faMicrochip",
        "faNetworkWired",
        "faRobot",
        "faDatabase",
        "faPenNib",
        "faCodeMerge",
        "faCloud",
      ],
      brands: ["faGithub", "faLinkedin", "faNode", "faVuejs", "faFlutter"],
    },
  },
  css: [
    "~/assets/styles/global.scss",
    "material-icons/iconfont/material-icons.css",
  ],
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          api: "modern-compiler",
        },
      },
    },
  },
  app: {
    head: {
      title: 'AurLemon Intro',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ]
    }
  }
});
