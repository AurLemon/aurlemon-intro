<template>
	<section
		class="my-4 rounded-2xl border border-slate-200/80 p-4 dark:border-slate-700/80"
	>
		<div class="mb-3 flex items-center justify-between gap-3">
			<div>
				<p class="text-xs text-slate-500 dark:text-slate-400">
					{{ t('main.project.githubContributionsTitle') }}
				</p>
				<p
					class="font-(family-name:--font-family) text-xl font-semibold text-slate-900 dark:text-slate-100"
				>
					{{
						t('main.project.commitsInLastYear', {
							count: calendar?.totalContributions ?? 0,
						})
					}}
				</p>
			</div>
			<UButton
				v-if="calendar?.username"
				class="font-mono"
				:to="`https://github.com/${calendar.username}`"
				target="_blank"
				variant="link"
				color="neutral"
				size="xs"
			>
				@{{ calendar.username }}
			</UButton>
		</div>

		<div
			v-if="pending"
			class="grid auto-cols-fr grid-flow-col gap-1 overflow-x-auto py-2"
		>
			<div
				v-for="week in 20"
				:key="`skeleton-week-${week}`"
				class="grid grid-rows-7 gap-1"
			>
				<span
					v-for="day in 7"
					:key="`skeleton-day-${week}-${day}`"
					class="size-3 rounded-sm bg-slate-200 dark:bg-slate-700"
				/>
			</div>
		</div>

		<div
			v-else-if="error"
			class="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-600 dark:border-rose-700/60 dark:bg-rose-900/20 dark:text-rose-300"
		>
			<p class="mb-2">Failed to load contribution calendar.</p>
			<UButton size="xs" variant="soft" color="neutral" @click="refresh()">
				Retry
			</UButton>
		</div>

		<div
			v-else-if="calendar"
			class="grid auto-cols-fr grid-flow-col gap-1 overflow-x-auto py-2"
		>
			<div
				v-for="(week, weekIndex) in calendar.weeks"
				:key="`week-${weekIndex}-${week.firstDay}`"
				class="grid grid-rows-7 gap-1"
			>
				<UTooltip
					v-for="day in week.contributionDays"
					:key="day.date"
					:delay-duration="80"
				>
					<span
						class="block size-3 rounded-[3px] border border-black/5 dark:border-white/10"
						:style="{ backgroundColor: resolveDayColor(day) }"
					/>

					<template #content>
						<div class="flex items-center gap-2 text-xs">
							<UIcon name="i-lucide-calendar-days" class="size-3.5" />
							<span class="tabular-nums">{{
								formatTooltipDate(day.date)
							}}</span>
							<UIcon name="i-lucide-git-commit-horizontal" class="size-3.5" />
							<span class="tabular-nums">{{ day.contributionCount }}</span>
						</div>
					</template>
				</UTooltip>
			</div>
		</div>
	</section>
</template>

<script setup lang="ts">
import type {
	GithubContributionCalendar,
	GithubContributionDay,
} from '~/shared/types/github-contributions'
import { useI18n } from 'vue-i18n'

const props = withDefaults(
	defineProps<{
		username?: string
		days?: number
	}>(),
	{
		username: undefined,
		days: 365,
	},
)

const colorMode = useColorMode()
const { locale, t } = useI18n()

const key = computed(
	() => `github-contributions-${props.username ?? 'default'}-${props.days}`,
)

const {
	data: calendar,
	pending,
	error,
	refresh,
} = await useAsyncData(
	key,
	() =>
		$fetch<GithubContributionCalendar>('/api/github/contributions', {
			query: {
				username: props.username,
				days: props.days,
			},
		}),
	{
		watch: [() => props.username, () => props.days],
	},
)

const formatTooltipDate = (isoDate: string): string => {
	return new Intl.DateTimeFormat(locale.value, {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	}).format(new Date(isoDate))
}

const resolveDayColor = (day: GithubContributionDay): string => {
	if (day.contributionCount <= 0) {
		return colorMode.value === 'dark' ? '#334155' : '#e2e8f0'
	}

	const fallback = [
		'#ebedf0',
		'#9be9a8',
		'#40c463',
		'#30a14e',
		'#216e39',
	] as const
	const colors = calendar.value?.colors?.length
		? calendar.value.colors
		: fallback

	const levelToIndex = (
		level: GithubContributionDay['contributionLevel'],
	): number => {
		if (colors.length >= 5) {
			const map: Record<GithubContributionDay['contributionLevel'], number> = {
				NONE: 0,
				FIRST_QUARTILE: 1,
				SECOND_QUARTILE: 2,
				THIRD_QUARTILE: 3,
				FOURTH_QUARTILE: 4,
			}
			return map[level]
		}

		const compactMap: Record<
			GithubContributionDay['contributionLevel'],
			number
		> = {
			NONE: 0,
			FIRST_QUARTILE: 0,
			SECOND_QUARTILE: 1,
			THIRD_QUARTILE: 2,
			FOURTH_QUARTILE: 3,
		}
		return compactMap[level]
	}

	return colors[levelToIndex(day.contributionLevel)] ?? colors[0] ?? '#9be9a8'
}
</script>
