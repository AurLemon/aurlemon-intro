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
		'@nuxt/ui',
	],
	ui: {
		fonts: false,
		theme: {
			colors: ['primary', 'neutral', 'success', 'warning', 'danger'],
		},
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
	css: [
		'~/assets/styles/main.css',
		'~/assets/styles/tailwind.css',
		'material-icons/iconfont/material-icons.css',
	],
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
