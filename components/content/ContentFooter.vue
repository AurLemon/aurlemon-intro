<template>
	<div
		class="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 pt-6 text-sm font-(family-name:--font-family) text-slate-400 dark:border-slate-700 dark:text-slate-400"
	>
		<p v-if="updatedText" class="flex items-center gap-1.5 leading-[normal]">
			<UIcon
				name="i-lucide-history"
				class="size-4 shrink-0 text-slate-400 dark:text-slate-500"
			/>
			<span>{{ updatedText }}</span>
		</p>
		<p v-if="statsText" class="flex items-center gap-1.5 leading-[normal]">
			<UIcon
				name="i-lucide-file-text"
				class="size-4 shrink-0 text-slate-400 dark:text-slate-500"
			/>
			<span>{{ statsText }}</span>
		</p>
	</div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

type ContentDoc = {
	body?: unknown
	updatedAt?: string
}

const props = defineProps<{
	doc: ContentDoc
}>()

const { t, locale } = useI18n()

const extractText = (node: unknown): string => {
	if (typeof node === 'string') {
		return node
	}

	if (Array.isArray(node)) {
		if (
			node.length >= 2 &&
			typeof node[0] === 'string' &&
			node[1] !== null &&
			typeof node[1] === 'object' &&
			!Array.isArray(node[1])
		) {
			return node.slice(2).map(extractText).join(' ')
		}

		return node.map(extractText).join(' ')
	}

	if (node !== null && typeof node === 'object') {
		const record = node as Record<string, unknown>

		if (Array.isArray(record.value)) {
			return record.value.map(extractText).join(' ')
		}

		if (Array.isArray(record.children)) {
			return record.children.map(extractText).join(' ')
		}

		if (typeof record.text === 'string') {
			return record.text
		}
	}

	return ''
}

const normalizeText = (text: string) => text.replace(/\s+/g, ' ').trim()

const contentText = computed(() => normalizeText(extractText(props.doc.body)))

const cjkCharCount = computed(
	() =>
		(
			contentText.value.match(
				/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af]/g,
			) || []
		).length,
)

const englishWordCount = computed(
	() =>
		(contentText.value.match(/\b(?:[A-Za-z]+(?:'[A-Za-z]+)?|\d+)\b/g) || [])
			.length,
)

const totalCount = computed(() => cjkCharCount.value + englishWordCount.value)

const readingMinutes = computed(() =>
	Math.max(
		1,
		Math.ceil(cjkCharCount.value / 250 + englishWordCount.value / 180),
	),
)

const statsText = computed(() =>
	t('main.contentFooter.stats', {
		count: totalCount.value,
		minutes: readingMinutes.value,
	}),
)

const formatUpdatedDate = (date: Date) => {
	const year = date.getFullYear()
	const month = date.getMonth() + 1
	const day = date.getDate()
	const hour = date.getHours()
	const minute = String(date.getMinutes()).padStart(2, '0')

	if (locale.value.startsWith('ja')) {
		return `${year} 年 ${month} 月 ${day} 日 ${hour}:${minute}`
	}

	if (locale.value.startsWith('zh')) {
		return `${year} 年 ${month} 月 ${day} 日 ${hour}:${minute}`
	}

	return new Intl.DateTimeFormat(locale.value, {
		year: 'numeric',
		month: 'numeric',
		day: 'numeric',
		hour: 'numeric',
		minute: '2-digit',
		hour12: false,
		timeZone: 'Asia/Shanghai',
	}).format(date)
}

const updatedText = computed(() => {
	if (!props.doc.updatedAt) {
		return ''
	}

	const updatedDate = new Date(props.doc.updatedAt)

	if (Number.isNaN(updatedDate.getTime())) {
		return ''
	}

	const formattedDate = formatUpdatedDate(updatedDate)

	return t('main.contentFooter.updatedAt', {
		date: formattedDate,
	})
})
</script>
