<template>
	<div class="my-6 font-sans [&_*]:break-normal [&_*]:[overflow-wrap:anywhere]">
		<HorizontalScroller
			ref="scroller"
			snap
			fade-edges
			compact-swipe-only
			@scroll="syncActiveProject"
			@resize="syncActiveProject"
		>
			<div class="flex gap-4 pb-1">
				<article
					v-for="project in projects"
					:key="project.name"
					class="group/project relative isolate flex w-full min-w-0 flex-[0_0_100%] flex-col lg:w-[22rem] lg:flex-[0_0_22rem] snap-start overflow-hidden rounded-xl border border-slate-200 bg-(--color-surface-0) transition-colors duration-200 hover:bg-(--color-surface-2) focus-within:bg-(--color-surface-2) dark:border-slate-800 dark:bg-(--color-surface-1) dark:hover:bg-(--color-surface-0) dark:focus-within:bg-(--color-surface-0)"
				>
					<SkeletonImage
						:src="project.image"
						:alt="project.name"
						class="aspect-[3/2] w-full brightness-100 transition-[filter] duration-200 group-hover/project:brightness-90 group-focus-within/project:brightness-90 motion-reduce:transition-none"
						image-class="absolute inset-0 h-full w-full object-cover object-top"
					/>

					<div class="flex min-h-32 flex-1 flex-col justify-between gap-4 p-4">
						<h3
							class="m-0 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm leading-6 font-semibold text-slate-900 dark:text-slate-100"
						>
							<NuxtLink
								:to="project.website"
								target="_blank"
								rel="noopener noreferrer"
								class="after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-primary"
								>{{ project.name }}</NuxtLink
							>
							<UBadge
								color="neutral"
								variant="soft"
								size="sm"
								class="shrink-0 font-normal"
								><time :datetime="project.startedAt">{{
									project.dateLabel
								}}</time></UBadge
							>
						</h3>
						<p
							class="m-0 grow text-sm leading-6 text-slate-600 dark:text-slate-300"
						>
							{{ $t(`main.project.portfolio.${project.key}`) }}
						</p>
						<div
							class="flex items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-300"
						>
							<NuxtLink
								:to="project.repository"
								target="_blank"
								rel="noopener noreferrer"
								class="relative z-10 inline-flex items-center gap-1.5 transition-colors hover:text-slate-700 dark:hover:text-slate-300"
								><UIcon name="i-lucide-github" class="size-4" />GitHub</NuxtLink
							>
							<span class="inline-flex min-w-0 items-center gap-1"
								><span class="truncate">{{ project.host }}</span
								><UIcon
									name="i-lucide-arrow-up-right"
									class="size-3.5 shrink-0"
							/></span>
						</div>
					</div>
				</article>
			</div>
		</HorizontalScroller>
		<div
			class="mt-3 flex items-center justify-center gap-2 text-xs text-slate-500 lg:hidden dark:text-slate-400"
		>
			<UButton
				icon="i-lucide-chevron-left"
				color="neutral"
				variant="ghost"
				size="xs"
				class="rounded-full"
				:aria-label="$t('content.imageCarousel.scrollLeft')"
				:disabled="activeProject === 0"
				@click="changeProject(-1)"
			/>
			<span
				aria-live="polite"
				aria-atomic="true"
				class="min-w-8 text-center tabular-nums"
				>{{ activeProject + 1 }}/{{ projects.length }}</span
			>
			<UButton
				icon="i-lucide-chevron-right"
				color="neutral"
				variant="ghost"
				size="xs"
				class="rounded-full"
				:aria-label="$t('content.imageCarousel.scrollRight')"
				:disabled="activeProject === projects.length - 1"
				@click="changeProject(1)"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
import introImage from '~/assets/resources/projects/aurlemon-intro.webp?w=960&h=640&q=85&thumbnail'
import hydcraftImage from '~/assets/resources/projects/hydcraft-portal.webp?w=960&h=640&q=85&thumbnail'
import tepsImage from '~/assets/resources/projects/fjcpc-teps.webp?w=960&h=640&q=85&thumbnail'

interface PortfolioProject {
	key: string
	name: string
	startedAt: string
	dateLabel: string
	repository: string
	website: string
	host: string
	image: string
}
const projects: PortfolioProject[] = [
	{
		key: 'intro',
		name: 'aurlemon-intro',
		startedAt: '2024-11',
		dateLabel: '2024/11',
		repository: 'https://github.com/AurLemon/aurlemon-intro',
		website: 'https://aurlemon.top',
		host: 'aurlemon.top',
		image: introImage,
	},
	{
		key: 'hydcraft',
		name: 'hydcraft-portal',
		startedAt: '2026-07',
		dateLabel: '2026/7',
		repository: 'https://github.com/Hydroline/hydcraft-portal',
		website: 'https://hydcraft.cn',
		host: 'hydcraft.cn',
		image: hydcraftImage,
	},
	{
		key: 'teps',
		name: 'fjcpc-transfer-exam-practice-system',
		startedAt: '2024-04',
		dateLabel: '2024/4',
		repository:
			'https://github.com/AurLemon/fjcpc-transfer-exam-practice-system',
		website: 'https://fjcpc-teps.aurlemon.top',
		host: 'fjcpc-teps.aurlemon.top',
		image: tepsImage,
	},
]
interface PortfolioScroller {
	viewport: HTMLElement | null
}
const scroller = ref<PortfolioScroller | null>(null)
const activeProject = ref(0)
const syncActiveProject = () => {
	const viewport = scroller.value?.viewport
	if (!viewport) return
	const cards = Array.from(viewport.querySelectorAll<HTMLElement>('article'))
	const origin = cards[0]?.offsetLeft ?? 0
	let nearest = 0
	for (let index = 1; index < cards.length; index++) {
		if (
			Math.abs(
				(cards[index]?.offsetLeft ?? origin) - origin - viewport.scrollLeft,
			) <
			Math.abs(
				(cards[nearest]?.offsetLeft ?? origin) - origin - viewport.scrollLeft,
			)
		)
			nearest = index
	}
	activeProject.value = nearest
}
const changeProject = (direction: number) => {
	const viewport = scroller.value?.viewport
	if (!viewport) return
	const cards = viewport.querySelectorAll<HTMLElement>('article')
	const target =
		cards[
			Math.max(
				0,
				Math.min(projects.length - 1, activeProject.value + direction),
			)
		]
	if (!target) return
	viewport.scrollTo({
		left: target.offsetLeft - (cards[0]?.offsetLeft ?? 0),
		behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
			? 'instant'
			: 'smooth',
	})
}
</script>
