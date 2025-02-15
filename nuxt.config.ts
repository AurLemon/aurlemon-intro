// https://nuxt.com/docs/api/configuration/nuxt-config

export default defineNuxtConfig({
    compatibilityDate: '2024-04-03',
    ssr: true,
    devtools: { enabled: false },
    plugins: [
        '~/plugins/floating-vue.ts',
        '~/plugins/v-clipboard.ts',
        { src: '~/plugins/baidu-stat.ts', mode: 'client' },
        { src: '~/plugins/ms-clarity.ts', mode: 'client' },
    ],
    modules: ['@pinia/nuxt', '@vesp/nuxt-fontawesome', 'nuxt-svgo', '@nuxt/content', 'nuxt-locomotive-scroll', '@prisma/nuxt', 'nuxt-toc'],
    svgo: {
        global: false,
        defaultImport: 'component',
    },
    fontawesome: {
        component: 'fa',
        icons: {
            solid: [
                'faCode',
                'faLaptopCode',
                'faMicrochip',
                'faNetworkWired',
                'faRobot',
                'faDatabase',
                'faPenNib',
                'faCodeMerge',
                'faCloud',
                'faGlobe',
            ],
            brands: [
                'faGithub',
                'faLinkedin',
                'faNode',
                'faVuejs',
                'faFlutter',
                'faBilibili',
                'faDocker',
            ],
        },
    },
    css: [
        '~/assets/styles/global.scss',
        'material-icons/iconfont/material-icons.css',
    ],
    vite: {
        css: {
            preprocessorOptions: {
                scss: {
                    api: 'modern-compiler',
                },
            },
        },

        // 神医：https://github.com/nuxt/nuxt/issues/24690
        ssr: {
            external: ['@prisma/client']
        },
        resolve: {
            alias: {
                '.prisma/client/index-browser': './node_modules/.prisma/client/index-browser.js',
            }
        },
    },
    app: {
        head: {
            title: 'AurLemon Intro',
            link: [
                {
                    rel: 'icon',
                    type: 'image/x-icon',
                    href: '/favicon.ico',
                },
            ],
            meta: [
                { charset: 'utf-8' },
                { name: 'viewport', content: 'width=device-width, initial-scale=1' },
            ],
        },
        pageTransition: { name: 'page', mode: 'out-in' },
    },
    runtimeConfig: {
        githubToken: process.env.GITHUB_TOKEN ?? 'github_pat',
        bdUrl: process.env.DATABASE_URL,

        public: {
            baiduStatKey: process.env.BAIDU_STAT_KEY,
            msClarityId: process.env.MS_CLARITY_ID,
        },
    },
})