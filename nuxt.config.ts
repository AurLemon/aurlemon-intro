import { dirname, resolve } from 'node:path'
import { createRequire } from 'node:module'
import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config

const require = createRequire(import.meta.url)
const prismaClientBrowserEntry = resolve(
	dirname(require.resolve('@prisma/client/package.json')),
	'../../.prisma/client/index-browser.js',
)

export default defineNuxtConfig({
	compatibilityDate: '2024-04-03',
	ssr: true,
	devtools: { enabled: false },
	plugins: [
		{ src: '~/plugins/baidu-stat.ts', mode: 'client' },
		{ src: '~/plugins/microsoft-clarity.ts', mode: 'client' },
	],
	modules: [
		'@nuxt/eslint',
		'@pinia/nuxt',
		'@vesp/nuxt-fontawesome',
		'nuxt-svgo',
		'@nuxt/content',
		[
			'@nuxtjs/i18n',
			{
				defaultLocale: 'zh-CN',
				strategy: 'prefix_except_default',
				lazy: true,
				langDir: '../locals',
				locales: [
					{ code: 'zh-CN', name: '简体中文', file: 'zh-CN.json' },
					{ code: 'ja-JP', name: '日本語', file: 'ja-JP.json' },
					{ code: 'en-US', name: 'English', file: 'en-US.json' },
				],
				detectBrowserLanguage: {
					useCookie: true,
					cookieKey: 'i18n_redirected',
					redirectOn: 'root',
				},
				vueI18n: './i18n.config.ts',
			},
		],
		'@nuxt/ui',
	],
	ui: {
		fonts: false,
		theme: {
			colors: [
				'primary',
				'secondary',
				'success',
				'info',
				'warning',
				'error',
				'neutral',
			],
		},
	},
	colorMode: {
		preference: 'system',
	},
	content: {
		experimental: {
			sqliteConnector: 'native',
		},
	},
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
	css: ['~/assets/styles/main.css', '~/assets/styles/tailwind.css'],
	vite: {
		plugins: [tailwindcss()],
		ssr: {
			external: ['@prisma/client'],
		},
		resolve: {
			alias: {
				'.prisma/client/index-browser': prismaClientBrowserEntry,
			},
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
			titleTemplate: '%s',
		},
		pageTransition: { name: 'page', mode: 'out-in' },
	},
	typescript: {
		strict: true,
		typeCheck: process.env.NODE_ENV === 'production',
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
