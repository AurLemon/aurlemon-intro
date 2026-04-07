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
	runtimeConfig: {
		public: {
			baiduStatKey: '',
			msClarityId: '',
		},
	},
	components: [
		{
			path: '~/components',
			pathPrefix: false,
		},
	],
	plugins: [
		{ src: '~/plugins/baidu-stat.ts', mode: 'client' },
		{ src: '~/plugins/microsoft-clarity.ts', mode: 'client' },
	],
	modules: [
		'@nuxt/eslint',
		'@pinia/nuxt',
		'@vesp/nuxt-fontawesome',
		'nuxt-svgo',
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
				detectBrowserLanguage: false,
				vueI18n: './i18n.config.ts',
			},
		],
		['@nuxtjs/seo', {}],
		'@nuxt/content',
		'@nuxt/ui',
	],
	seo: {
		enabled: false,
	},
	schemaOrg: {
		enabled: false,
	},
	ogImage: {
		enabled: false,
	},
	sitemap: {
		autoLastmod: true,
	},
	robots: {
		sitemap: '/sitemap.xml',
		disallow: ['/api/**'],
	},
	linkChecker: {
		failOnError: true,
		fetchRemoteUrls: false,
		excludeLinks: ['/api/**'],
		excludePages: ['/api/**'],
		report: {
			html: true,
			markdown: true,
		},
	},
	site: {
		url: process.env.NUXT_SITE_URL,
		name: 'AurLemon Intro',
		description:
			'A personal site by AurLemon, built with Nuxt 4 and TypeScript, focused on profile, projects, and preferences.',
		defaultLocale: 'zh-CN',
	},
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
	icon: {
		clientBundle: {
			icons: [
				'lucide:sun',
				'lucide:moon',
				'lucide:monitor',
				'lucide:languages',
				'lucide:check',
				'lucide:check-circle-2',
				'lucide:heart',
				'lucide:messages-square',
				'lucide:calendar-days',
				'lucide:git-commit-horizontal',
				'lucide:file-text',
				'lucide:history',
			],
		},
		serverBundle: {
			collections: ['lucide'],
		},
		fallbackToApi: false,
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
	css: [
		'~/assets/styles/fonts.css',
		'~/assets/styles/main.css',
		'~/assets/styles/tailwind.css',
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
					rel: 'preconnect',
					href: 'https://fonts.gstatic.cn',
					crossorigin: '',
				},
				{
					rel: 'preconnect',
					href: 'https://cdn-font.hyperos.mi.com',
					crossorigin: '',
				},
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
})
