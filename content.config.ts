// https://content.nuxt.com/docs/getting-started/installation
import { defineContentConfig, defineCollection, z } from '@nuxt/content'

export default defineContentConfig({
	collections: {
		content: defineCollection({
			type: 'page',
			source: '**/*.md',
			schema: z
				.object({
					updatedAt: z.string().optional(),
				})
				.passthrough(),
		}),
	},
})
