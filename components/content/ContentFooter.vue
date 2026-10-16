<template>
	<div
		class="flex flex-wrap justify-center items-center gap-x-4 lg:gap-x-6 gap-y-2 text-sm font-(family-name:--font-family) text-slate-400 dark:border-slate-700 dark:text-slate-400"
	>
		<UTooltip v-if="createdText" :text="createdFullText" :delay-duration="50">
			<p
				tabindex="0"
				class="flex items-center gap-1.5 leading-[normal] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
			>
				<UIcon
					name="i-lucide-calendar-plus"
					class="size-4 shrink-0 text-slate-400 dark:text-slate-500"
				/>
				<time :datetime="doc.createdAt">{{ createdText }}</time>
			</p>
		</UTooltip>
		<UTooltip v-if="updatedText" :text="updatedFullText" :delay-duration="50">
			<p
				tabindex="0"
				class="flex items-center gap-1.5 leading-[normal] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
			>
				<UIcon
					name="i-lucide-history"
					class="size-4 shrink-0 text-slate-400 dark:text-slate-500"
				/>
				<time :datetime="doc.updatedAt">{{ updatedText }}</time>
			</p>
		</UTooltip>
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

interface ContentDoc {
	createdAt?: string
	body?: unknown
	updatedAt?: string
}

const props = defineProps<{
	doc: ContentDoc
}>()

const { t, locale } = useI18n({ useScope: 'global' })

const contentStats = computed(() => getContentStats(props.doc.body))

const statsText = computed(() =>
	t('main.contentFooter.stats', {
		count: contentStats.value.totalCount,
		minutes: contentStats.value.readingMinutes,
	}),
)

const formatDateText = (
	value: string | undefined,
	key: 'createdAt' | 'updatedAt',
	includeTime = false,
): string => {
	if (!value) return ''
	const date = new Date(value)
	if (Number.isNaN(date.getTime())) return ''
	const formattedDate = new Intl.DateTimeFormat(locale.value, {
		year: 'numeric',
		month: 'numeric',
		day: 'numeric',
		timeZone: 'Asia/Shanghai',
		...(includeTime
			? ({
					hour: '2-digit',
					minute: '2-digit',
					second: '2-digit',
					hour12: false,
				} as const)
			: {}),
	}).format(date)
	return t(`main.contentFooter.${key}`, { date: formattedDate })
}

const createdText = computed(() =>
	formatDateText(props.doc.createdAt, 'createdAt'),
)
const updatedText = computed(() =>
	formatDateText(props.doc.updatedAt, 'updatedAt'),
)
const createdFullText = computed(() =>
	formatDateText(props.doc.createdAt, 'createdAt', true),
)
const updatedFullText = computed(() =>
	formatDateText(props.doc.updatedAt, 'updatedAt', true),
)
</script>
