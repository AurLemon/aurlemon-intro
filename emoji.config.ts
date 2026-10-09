import type { EmojiFontOptions } from './build/emoji-font/types'

export default {
	family: 'AurLemon Emoji',
	include: ['**/*.{vue,js,mjs,cjs,ts,mts,cts,md,mdc,json}'],
	exclude: [
		'**/node_modules/**',
		'**/.*/**',
		'**/dist/**',
		'**/coverage/**',
		'**/*.d.ts',
	],
	extraEmoji: [],
	source: {
		// This release has CBDT/CBLC and GSUB; newer Linux builds use AAT.
		url: 'https://github.com/samuelngs/apple-emoji-ttf/releases/download/v18.4/AppleColorEmoji.ttf',
		sha256: 'a4fd077bd11437b4940d8cf08f4084e1edfd4ae359f92573ec576652f885eabd',
	},
	proxy: process.env.EMOJI_FONT_PROXY,
} satisfies EmojiFontOptions
