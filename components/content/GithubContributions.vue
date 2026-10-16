<template>
	<section class="min-w-0">
		<div
			v-if="isLoading && !error"
			key="skeleton"
			class="space-y-3 animate-pulse"
		>
			<USkeleton class="h-28 w-full rounded-md" />
			<div class="flex justify-between">
				<USkeleton class="h-4 w-28" /><USkeleton class="h-4 w-24" />
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
				<p class="mb-2">{{ t('main.project.githubLoadFailed') }}</p>
				<UButton size="xs" variant="soft" color="neutral" @click="refresh()">
					{{ t('main.project.githubRetry') }}
				</UButton>
			</div>

			<div v-else-if="calendar" key="content" class="space-y-1">
				<HorizontalScroller
					ref="scroller"
					snap
					compact-swipe-only
					:show-edge-overlay="false"
					:scroll-step="cellSize + 4"
					@resize="onCalendarResize"
					@scroll="clearDayTooltip"
				>
					<div
						@pointerover="onDayPointerOver"
						@pointerout="onDayPointerOut"
						@pointerleave="clearDayTooltip"
						@focusin="onDayFocus"
						@focusout="clearDayTooltip"
						class="grid w-max grid-flow-col gap-1 py-1"
						:style="{ gridAutoColumns: `${cellSize}px` }"
					>
						<div
							v-for="(week, weekIndex) in calendar?.weeks ?? []"
							:key="`week-${weekIndex}-${week.firstDay}`"
							class="grid snap-start grid-rows-7 gap-1"
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
									class="block aspect-square w-full rounded-[3px] border border-black/5 focus-visible:outline-2 focus-visible:outline-primary dark:border-white/10"
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
									class="block aspect-square w-full rounded-[3px] border border-black/5 bg-slate-200 dark:border-white/10 dark:bg-slate-700"
									aria-hidden="true"
								/>
							</template>
						</div>
					</div>
				</HorizontalScroller>
				<div
					class="mt-2 flex items-center justify-between gap-3 text-sm text-slate-600 dark:text-slate-300"
				>
					<NuxtLink
						:to="`https://github.com/${calendar?.username}`"
						target="_blank"
						rel="noopener noreferrer"
						class="group/github inline-flex items-center gap-1.5"
					>
						<UIcon name="i-lucide-github" class="size-4" />
						<span
							class="transition-colors duration-200 group-hover/github:text-slate-800 group-focus-visible/github:text-slate-800 dark:group-hover/github:text-slate-100 dark:group-focus-visible/github:text-slate-100"
							>@{{ calendar?.username }}</span
						>
					</NuxtLink>
					<UTooltip
						:text="
							t('main.project.githubRange', {
								from: formatRangeDate(calendar?.from ?? ''),
								to: formatRangeDate(calendar?.to ?? ''),
							})
						"
					>
						<span
							tabindex="0"
							class="inline-flex items-center gap-1.5 font-(family-name:--font-family) tabular-nums"
						>
							<UIcon
								name="i-lucide-git-branch"
								aria-hidden="true"
								class="size-4 shrink-0"
							/>

							{{ calendar?.totalContributions.toLocaleString(locale) }}
							Commits
						</span>
					</UTooltip>
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
const scroller = ref<{
	viewport: HTMLElement | null
	updateEdges: () => void
} | null>(null)
const calendarWidth = ref(0)
const cellSize = computed(() => {
	const width = calendarWidth.value
	if (!width) return 12
	const weeks = calendar.value?.weeks.length || 53
	const visibleWeeks = Math.min(
		weeks,
		Math.max(1, Math.floor((width + 4) / 16)),
	)
	return (width - (visibleWeeks - 1) * 4) / visibleWeeks
})

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
	() =>
		!error.value && (pending.value || !calendar.value || isPlaceholder.value),
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
	const el = scroller.value?.viewport
	if (!el) {
		return
	}

	el.scrollTo({
		left: Math.max(0, el.scrollWidth - el.clientWidth),
		behavior: 'instant',
	})
	scroller.value?.updateEdges()
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

const onCalendarResize = (width: number): void => {
	calendarWidth.value = width
	void scrollCalendarToLatest()
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

const rangeDateFormatter = computed(
	() =>
		new Intl.DateTimeFormat(locale.value, {
			year: 'numeric',
			month: /^(zh|ja)/.test(locale.value) ? 'numeric' : 'long',
			day: 'numeric',
			timeZone: 'UTC',
		}),
)
const formatRangeDate = (isoDate: string): string => {
	const parts = rangeDateFormatter.value.formatToParts(new Date(isoDate))
	const part = (type: Intl.DateTimeFormatPartTypes) =>
		parts.find((item) => item.type === type)?.value ?? ''
	return /^(zh|ja)/.test(locale.value)
		? `${part('year')}年${part('month')}月${part('day')}日`
		: `${part('day')} ${part('month')} ${part('year')}`
}

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
