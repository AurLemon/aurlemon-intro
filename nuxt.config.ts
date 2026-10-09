import tailwindcss from '@tailwindcss/vite'
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'
import emojiFontOptions from './emoji.config'

// https://nuxt.com/docs/api/configuration/nuxt-config

const analyticsPlugins =
	process.env.NODE_ENV === 'production'
		? [
				{ src: '~/plugins/baidu-stat.ts', mode: 'client' as const },
				{ src: '~/plugins/microsoft-clarity.ts', mode: 'client' as const },
			]
		: []
const siteUrl = process.env.NUXT_SITE_URL || 'https://aurlemon.top'

export default defineNuxtConfig({
	compatibilityDate: '2024-04-03',
	ssr: true,
	devtools: { enabled: false },
	runtimeConfig: {
		public: {
			baiduStatKey: '',
			canonicalSiteUrl: siteUrl,
			msClarityId: '',
		},
	},
	components: [
		{
			path: '~/components',
			pathPrefix: false,
		},
	],
	plugins: [...analyticsPlugins],
	modules: [
		['./build/emoji-font/nuxt', emojiFontOptions],
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
				langDir: '../locales',
				locales: [
					{ code: 'zh-CN', name: '简体中文', file: 'zh-CN.json' },
					{ code: 'ja-JP', name: '日本語', file: 'ja-JP.json' },
					{ code: 'en-US', name: 'English', file: 'en-US.json' },
				],
				detectBrowserLanguage: false,
				vueI18n: '../i18n.config.ts',
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
		exclude: ['/journey', '/en-US/journey', '/ja-JP/journey'],
	},
	robots: {
		sitemap: '/sitemap_index.xml',
		disallow: ['/api/**'],
	},
	routeRules: {
		'/journey': {
			robots: 'noindex, follow',
		},
		'/en-US/journey': {
			robots: 'noindex, follow',
		},
		'/ja-JP/journey': {
			robots: 'noindex, follow',
		},
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
		url: siteUrl,
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
				'lucide:x',
				'lucide:chevron-left',
				'lucide:chevron-right',
				'lucide:circle-alert',
				'lucide:chevron-down',
				'lucide:github',
				'lucide:log-in',
				'lucide:log-out',
				'lucide:settings',
				'lucide:pin',
				'lucide:trash-2',
				'lucide:ellipsis',
				'lucide:pencil',
				'lucide:reply',
				'lucide:chevrons-down',
				'lucide:triangle-alert',
				'lucide:user-round',
				'lucide:users',
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
		build: {
			markdown: {
				remarkPlugins: {
					'remark-math': {
						instance: remarkMath,
					},
				},
				rehypePlugins: {
					'rehype-katex': {
						instance: rehypeKatex,
						options: {
							strict: 'ignore',
							throwOnError: false,
						},
					},
				},
			},
		},
	},
	svgo: {
		global: false,
		autoImportPath: false,
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
		'~/assets/styles/fonts/index.css',
		'~/assets/styles/base/main.css',
		'~/assets/styles/base/tailwind.css',
		'katex/dist/katex.min.css',
	],
	vite: {
		plugins: [tailwindcss()],
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
