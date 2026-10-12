<template>
	<section
		class="my-4 rounded-2xl border border-slate-200/80 p-4 dark:border-slate-700/80"
	>
		<div v-if="isLoading" key="skeleton" class="space-y-1 animate-pulse">
			<div class="flex w-full items-start justify-between gap-3">
				<div class="flex flex-col gap-2">
					<USkeleton
						class="h-3 w-24 rounded-md bg-slate-200 dark:bg-slate-700"
					/>
					<USkeleton
						class="h-6 w-32 rounded-md bg-slate-200 dark:bg-slate-700"
					/>
				</div>
				<USkeleton class="h-6 w-20 rounded-md bg-slate-200 dark:bg-slate-700" />
			</div>

			<div
				class="grid grid-flow-col auto-cols-[12px] gap-1 overflow-x-auto py-2"
			>
				<div
					v-for="week in skeletonWeekCount"
					:key="`skeleton-week-${week}`"
					class="grid grid-rows-7 gap-1"
				>
					<USkeleton
						v-for="day in 7"
						:key="`skeleton-day-${week}-${day}`"
						class="size-3 rounded-[3px] bg-slate-200 dark:bg-slate-700"
					/>
				</div>
			</div>
		</div>

		<Transition
			v-else
			name="contrib-fade"
			mode="out-in"
			@after-enter="scrollCalendarToLatest"
		>
			<div
				v-if="error"
				key="error"
				class="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-600 dark:border-rose-700/60 dark:bg-rose-900/20 dark:text-rose-300"
			>
				<p class="mb-2">Failed to load contribution calendar.</p>
				<UButton size="xs" variant="soft" color="neutral" @click="refresh()">
					Retry
				</UButton>
			</div>

			<div v-else-if="calendar" key="content" class="space-y-1">
				<div class="flex w-full items-start justify-between gap-3">
					<div>
						<p class="text-xs text-slate-500 dark:text-slate-400 mb-0.5">
							{{ t('main.project.githubContributionsTitle') }}
						</p>
						<p
							class="font-(family-name:--font-family) text-xl font-semibold text-slate-900 dark:text-slate-100"
						>
							{{
								t('main.project.commitsInLastYear', {
									count: calendar.totalContributions,
								})
							}}
						</p>
					</div>
					<UButton
						v-if="calendar.username"
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
					ref="calendarScrollRef"
					@pointerover="onDayPointerOver"
					@pointerout="onDayPointerOut"
					@pointerleave="clearDayTooltip"
					@focusin="onDayFocus"
					@focusout="clearDayTooltip"
					@scroll="clearDayTooltip"
					class="grid grid-flow-col auto-cols-[12px] gap-1 overflow-x-auto py-2"
				>
					<div
						v-for="(week, weekIndex) in calendar?.weeks ?? []"
						:key="`week-${weekIndex}-${week.firstDay}`"
						class="grid grid-rows-7 gap-1"
					>
						<template
							v-for="(day, dayIndex) in week.contributionDays"
							:key="day?.date ?? `empty-${weekIndex}-${dayIndex}`"
						>
							<span
								v-if="day"
								:data-contribution-day="day.date"
								:aria-label="`${formatTooltipDate(day.date)} ${day.contributionCount}`"
								tabindex="0"
								class="block size-3 rounded-[3px] border border-black/5 dark:border-white/10"
								:class="
									day.contributionCount <= 0
										? 'bg-slate-200 dark:bg-slate-700'
										: ''
								"
								:style="
									day.contributionCount > 0
										? { backgroundColor: resolveDayColor(day) }
										: undefined
								"
							/>

							<span
								v-else
								class="block size-3 rounded-[3px] opacity-0"
								aria-hidden="true"
							/>
						</template>
					</div>
				</div>
			</div>
		</Transition>
		<UTooltip
			:reference="activeDayElement ?? undefined"
			:open="dayTooltipOpen"
			:disabled="!activeDay"
			@update:open="dayTooltipOpen = $event"
		>
			<template #content>
				<div
					v-if="activeDay"
					class="flex items-center gap-1.5 text-xs leading-[normal]"
				>
					<span class="flex items-center gap-1">
						<UIcon name="i-lucide-calendar-days" class="size-2.5" />
						<span class="tabular-nums">{{
							formatTooltipDate(activeDay.date)
						}}</span>
					</span>
					<span class="flex items-center gap-0.5">
						<UIcon name="i-lucide-git-commit-horizontal" class="size-2.5" />
						<span class="tabular-nums">{{ activeDay.contributionCount }}</span>
					</span>
				</div>
			</template>
		</UTooltip>
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
		days: undefined,
	},
)

const { locale, t } = useI18n({ useScope: 'global' })
const skeletonWeekCount = 53
const calendarScrollRef = ref<HTMLElement | null>(null)

const key = computed(
	() =>
		`github-contributions-${props.username ?? 'default'}-${props.days ?? 'recent-year'}`,
)

const {
	data: calendar,
	pending,
	error,
	refresh,
} = useLazyAsyncData(
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

const isPlaceholder = computed(() => calendar.value?.isPlaceholder === true)
const isLoading = computed(
	() => pending.value || !calendar.value || isPlaceholder.value,
)

const activeDay = shallowRef<GithubContributionDay | null>(null)
const activeDayElement = shallowRef<HTMLElement | null>(null)
const dayTooltipOpen = ref(false)
let dayTooltipTimer: ReturnType<typeof setTimeout> | undefined
const daysByDate = computed(
	() =>
		new Map(
			(calendar.value?.weeks ?? []).flatMap((week) =>
				week.contributionDays
					.filter((day) => day !== null)
					.map((day) => [day.date, day] as const),
			),
		),
)
const clearDayTooltip = () => {
	if (dayTooltipTimer) clearTimeout(dayTooltipTimer)
	dayTooltipTimer = undefined
	dayTooltipOpen.value = false
}
const showDayTooltip = (target: EventTarget | null, delay: number) => {
	const element =
		target instanceof HTMLElement
			? target.closest<HTMLElement>('[data-contribution-day]')
			: null
	const day = daysByDate.value.get(element?.dataset.contributionDay ?? '')
	if (!element || !day) {
		clearDayTooltip()
		return
	}
	if (
		activeDayElement.value === element &&
		(dayTooltipOpen.value || dayTooltipTimer)
	)
		return
	clearDayTooltip()
	activeDay.value = day
	activeDayElement.value = element
	dayTooltipTimer = setTimeout(() => {
		dayTooltipTimer = undefined
		dayTooltipOpen.value = true
	}, delay)
}
const onDayPointerOver = (event: PointerEvent) => {
	if (event.pointerType !== 'touch') showDayTooltip(event.target, 50)
}
const onDayPointerOut = (event: PointerEvent) => {
	const next =
		event.relatedTarget instanceof HTMLElement
			? event.relatedTarget.closest('[data-contribution-day]')
			: null
	if (next !== activeDayElement.value) clearDayTooltip()
}
const onDayFocus = (event: FocusEvent) => showDayTooltip(event.target, 0)

watch(isLoading, (loading) => {
	if (loading) clearDayTooltip()
})

let placeholderRefreshTimer: ReturnType<typeof setInterval> | undefined

const waitForNextFrame = (): Promise<void> => {
	return new Promise((resolve) => {
		requestAnimationFrame(() => resolve())
	})
}

const jumpCalendarToLatest = (): void => {
	const el = calendarScrollRef.value
	if (!el) {
		return
	}

	el.scrollLeft = Math.max(0, el.scrollWidth - el.clientWidth)
}

const scrollCalendarToLatest = async (): Promise<void> => {
	if (!import.meta.client) {
		return
	}

	await nextTick()
	await waitForNextFrame()
	await waitForNextFrame()

	jumpCalendarToLatest()
	await waitForNextFrame()
	jumpCalendarToLatest()
}

onMounted(() => {
	void scrollCalendarToLatest()
})

onActivated(() => {
	void scrollCalendarToLatest()
})

watch(
	isPlaceholder,
	(value) => {
		if (!import.meta.client) {
			return
		}
		if (value) {
			if (!placeholderRefreshTimer) {
				placeholderRefreshTimer = setInterval(() => {
					void refresh()
				}, 5000)
			}
			return
		}
		if (placeholderRefreshTimer) {
			clearInterval(placeholderRefreshTimer)
			placeholderRefreshTimer = undefined
		}
	},
	{ immediate: true },
)

watch(
	calendar,
	(value) => {
		clearDayTooltip()
		activeDay.value = null
		activeDayElement.value = null
		if (!value || value.isPlaceholder) {
			return
		}

		void scrollCalendarToLatest()
	},
	{ immediate: true },
)

onBeforeUnmount(() => {
	clearDayTooltip()
	if (placeholderRefreshTimer) {
		clearInterval(placeholderRefreshTimer)
		placeholderRefreshTimer = undefined
	}
})

const tooltipDateFormatter = computed(
	() =>
		new Intl.DateTimeFormat(locale.value, {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
		}),
)
const formatTooltipDate = (isoDate: string): string =>
	tooltipDateFormatter.value.format(new Date(isoDate))

const resolveDayColor = (day: GithubContributionDay): string => {
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

<style scoped>
.contrib-fade-enter-active,
.contrib-fade-leave-active {
	transition: opacity 180ms ease;
}

.contrib-fade-enter-from,
.contrib-fade-leave-to {
	opacity: 0;
}
</style>
