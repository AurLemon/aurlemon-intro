<template>
	<div
		class="flex flex-wrap justify-center items-center gap-x-4 lg:gap-x-6 gap-y-2 text-sm font-(family-name:--font-family) text-slate-400 dark:border-slate-700 dark:text-slate-400"
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
import { getContentStats } from '~/utils/content-stats'

type ContentDoc = {
	body?: unknown
	updatedAt?: string
}

const props = defineProps<{
	doc: ContentDoc
}>()

const { t, locale } = useI18n()

const contentStats = computed(() => getContentStats(props.doc.body))

const statsText = computed(() =>
	t('main.contentFooter.stats', {
		count: contentStats.value.totalCount,
		minutes: contentStats.value.readingMinutes,
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
