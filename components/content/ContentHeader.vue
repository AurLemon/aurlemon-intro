<template>
	<header
		data-content-header
		:data-content-page="page"
		class="py-12 pb-8 sm:pt-6"
	>
		<div
			v-if="showEmoji"
			aria-hidden="true"
			class="mb-4 text-6xl leading-none sm:mb-5 sm:text-7xl select-none"
		>
			{{ pageEmoji }}
		</div>
		<h1
			class="max-w-3xl font-serif font-bold tracking-tight text-slate-900/95 dark:text-slate-100"
			:class="
				isCjk
					? 'text-[clamp(2rem,10vw,2.5rem)] leading-[1.45] sm:text-[3.5rem]'
					: 'text-pretty text-4xl leading-snug sm:text-5xl sm:leading-snug'
			"
		>
			{{ title }}
		</h1>
		<ContentMetadata v-if="doc" class="mt-2 ml-1" :doc="doc" />
		<div v-if="$slots.default" class="mt-8"><slot /></div>
	</header>
</template>

<script setup lang="ts">
import type { ContentDocumentMeta } from '~/utils/content-stats'

interface Props {
	page: string
	title: string
	doc?: ContentDocumentMeta | null
	showEmoji?: boolean
}

const props = withDefaults(defineProps<Props>(), { showEmoji: true, doc: null })
const { locale } = useI18n({ useScope: 'global' })
const isCjk = computed(() => /^(zh|ja)/.test(locale.value))
const emojis: Record<string, string> = {
	profile: '🤔',
	project: '🤓',
	journey: '🥺',
	preference: '😋',
	about: '🧐',
	friends: '🥵',
}
const pageEmoji = computed(() => emojis[props.page] ?? '🙂')
</script>
