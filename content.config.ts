// https://content.nuxt.com/docs/getting-started/installation
import { defineContentConfig, defineCollection } from '@nuxt/content'

export default defineContentConfig({
    collections: {
        content: defineCollection({
            type: 'page',
            source: '**/*.md'
        })
    }
})
