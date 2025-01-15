// https://nuxt.com/docs/api/configuration/nuxt-config

export default defineNuxtConfig({
    compatibilityDate: "2024-04-03",
    ssr: true,
    devtools: { enabled: true },
    plugins: ["~/plugins/floating-vue.ts", "~/plugins/v-clipboard.ts"],
    modules: ["@pinia/nuxt", "@vesp/nuxt-fontawesome", 'nuxt-svgo', 'nuxt-locomotive-scroll'],
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
                "faGlobe",
            ],
            brands: [
                "faGithub",
                "faLinkedin",
                "faNode",
                "faVuejs",
                "faFlutter",
                "faBilibili",
            ],
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
            title: "AurLemon Intro",
            link: [
                {
                    rel: "icon",
                    type: "image/x-icon",
                    href: "/favicon.ico",
                },
            ],
            meta: [
                { charset: "utf-8" },
                { name: "viewport", content: "width=device-width, initial-scale=1" },
            ],
        },
    },
    runtimeConfig: {
        githubToken: process.env.GITHUB_TOKEN ?? "github_pat",
    },
})
