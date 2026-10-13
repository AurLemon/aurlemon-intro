<template>
	<div class="mt-4">
		<!-- 预渲染学校徽章，避免切换时加载延迟 -->
		<div class="sr-only" aria-hidden="true">
			<template v-for="stage in educationStages" :key="stage">
				<component
					v-if="isLogoComponent(educationLogos[stage])"
					:is="educationLogos[stage]"
					class="block"
				/>
				<img v-else :src="educationLogos[stage]" class="block" />
			</template>
		</div>

		<!-- 顶部问候 -->
		<div class="mx-2">
			<div class="relative h-38 w-38 sm:h-42 sm:w-42">
				<SkeletonImage
					loading="eager"
					:reveal-cached-immediately="true"
					:src="avatarMark"
					alt="AurLemon avatar"
					class="block h-full w-full rounded-full border-2 border-[#236F95] shadow-[0_0_32px_rgba(190,215,212,0.6)] dark:shadow-[0_0_32px_rgba(190,215,212,0.1)]"
					image-class="block h-full w-full rounded-full select-none"
					skeleton-class="rounded-full"
				/>
			</div>
			<div
				class="mt-6 font-serif text-slate-900 dark:text-slate-100 font-medium leading-snug"
				:class="locale === 'en-US' ? 'text-[34px] sm:text-4xl' : 'text-4xl'"
			>
				<span>{{ $t('main.index.line1Lead') }}</span>
				<span class="hidden sm:inline">{{ line1DesktopSeparator }}</span>
				<br class="sm:hidden" />
				<i18n-t
					keypath="main.index.line1Introduction"
					tag="span"
					scope="global"
				>
					<template #name>
						<HighlightText
							:text="$t('main.index.name')"
							:emoji="$t('main.index.lemonEmoji')"
							:before-text="nameHighlightContext.before"
							:desktop-before-text="nameHighlightContext.desktopBefore"
							:after-text="nameHighlightContext.after"
						/>
					</template> </i18n-t
				><span>{{ $t('main.index.line1Tail') }}</span>
				<br />
				<span
					:lang="locale"
					class="block pt-1 lg:mt-0"
					:class="{
						'hyphens-auto text-balance text-[34px] leading-snug sm:text-4xl sm:text-wrap':
							locale === 'en-US',
					}"
					>{{ introductionLine2 }}</span
				>
			</div>
		</div>

		<!-- 信息卡片 -->
		<ClientOnly>
			<MobileCardNavigationStack :container="cardGrid" />
		</ClientOnly>
		<div
			ref="cardGrid"
			class="mt-16 pb-10 grid grid-cols-1 lg:grid-cols-2 gap-5"
		>
			<div
				class="group/education relative"
				:class="{ 'z-10': isEducationMenuOpen }"
			>
				<InfoCard
					data-navigation-card="profile"
					:content-key="`${locale}-${selectedEducationStage}`"
					animated-title
				>
					<template #navigation="{ hovered, focused }">
						<CardNavigationHint
							:hovered="hovered"
							:focused="focused"
							to="/profile"
							label-key="main.index.card.navigation.profile"
							:page-label="$t('main.index.card.navigation.pages.profile')"
						/>
					</template>
					<template #background>
						<EducationCardBackground
							:badges="educationBackgroundBadges"
							:profiles="educationAppearanceProfiles"
							:menu-open="isEducationMenuOpen"
						/>
					</template>
					<template #logo>
						<SkeletonImage
							loading="eager"
							:reveal-cached-immediately="true"
							v-if="!currentEducationLogoIsComponent"
							:src="String(currentEducationLogo)"
							:alt="currentEducationStage.title"
							:show-skeleton="!hasEducationLogoSettled"
							class="block h-full w-full"
							image-class="block h-full w-full rounded-lg object-cover"
							skeleton-class="rounded-lg"
							@ready="handleEducationLogoReady"
						/>
						<component v-else :is="currentEducationLogo" class="block" />
					</template>
					<template
						#title="{ layoutTarget, logoTarget, availableWidth, minimumWidth }"
					>
						<EducationSchoolName
							:key="`${locale}-${selectedEducationStage}`"
							:full-name="currentEducationStage.title"
							:short-name="currentEducationStage.shortTitle"
							:layout-target="layoutTarget"
							:logo-target="logoTarget"
							:available-width="availableWidth"
							:minimum-width="minimumWidth"
						/>
					</template>
					<template #subtitle>{{ currentEducationStage.subtitle }}</template>
					<template #type>
						<div class="flex items-center justify-center w-full">
							<span class="pr-1">
								{{ $t('main.index.card.education.type') }}
							</span>
							<UPopover
								v-model:open="isEducationMenuOpen"
								:portal="false"
								:popper="{ placement: 'bottom-end' }"
								:ui="{ content: 'z-[40000]' }"
							>
								<UButton
									variant="link"
									color="neutral"
									class="relative font-semibold text-xs p-0 gap-0 cursor-pointer"
								>
									{{ currentEducationStage.label }}
									<svg
										viewBox="0 0 10 6"
										fill="none"
										aria-hidden="true"
										class="pointer-events-none absolute left-full ml-1 h-1.5 w-2.5 opacity-0 transition-opacity duration-200 group-hover/education:opacity-100 group-focus-within/education:opacity-100"
									>
										<path
											d="M1 1L5 5L9 1"
											stroke="currentColor"
											stroke-width="1.4"
											stroke-linecap="round"
											stroke-linejoin="round"
										/>
									</svg>
								</UButton>

								<template #content>
									<div class="w-52 space-y-1 p-2">
										<UButton
											v-for="stage in educationStages"
											:key="stage"
											type="button"
											color="neutral"
											variant="ghost"
											class="w-full justify-start gap-2 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-slate-100 dark:hover:bg-slate-800"
											:class="{
												'bg-primary-100/60 text-primary-600 dark:bg-primary-500/20 dark:text-primary-200':
													selectedEducationStage === stage,
												'text-slate-600 dark:text-slate-300':
													selectedEducationStage !== stage,
											}"
											@click="selectedEducationStage = stage"
										>
											<span class="flex-1 flex items-center gap-1">
												<span>{{ getEducationStage(stage).label }}</span>
												<span
													v-if="getEducationStage(stage).hint"
													class="text-xs text-slate-500 dark:text-slate-400"
												>
													{{ getEducationStage(stage).hint }}
												</span>
											</span>
											<UIcon
												v-if="selectedEducationStage === stage"
												name="i-lucide-check"
												class="ml-auto text-base"
											/>
										</UButton>
									</div>
								</template>
							</UPopover>
						</div>
					</template>
				</InfoCard>
			</div>

			<InfoCard data-navigation-card="project">
				<template #navigation="{ hovered, focused }">
					<CardNavigationHint
						:hovered="hovered"
						:focused="focused"
						to="/project"
						label-key="main.index.card.navigation.project"
						:page-label="$t('main.index.card.navigation.pages.project')"
					/>
				</template>
				<template #background><TechnologyCardBackground /></template>
				<template #logo>
					<div class="flex h-full w-full items-center justify-center">
						<SkeletonImage
							loading="eager"
							:reveal-cached-immediately="true"
							:src="techCoverUrl"
							:alt="$t('main.index.card.tech.title')"
							class="block h-16 w-16"
							image-class="block h-full w-full rounded-lg object-cover"
							skeleton-class="rounded-lg"
						/>
					</div>
				</template>
				<template #title>{{ $t('main.index.card.tech.title') }}</template>
				<template #subtitle>{{ $t('main.index.card.tech.subtitle') }}</template>
				<template #type>{{ $t('main.index.card.tech.type') }}</template>
			</InfoCard>

			<InfoCard
				data-navigation-card="acg"
				smooth-width
				:class="{ 'z-10': isAcgMenuOpen }"
				@visibility-change="isAcgVisible = $event"
			>
				<template #navigation="{ hovered, focused }">
					<CardNavigationHint
						:hovered="hovered"
						:focused="focused"
						to="/preference"
						label-key="main.index.card.navigation.acg"
						:page-label="$t('main.index.card.navigation.pages.preference')"
					/>
				</template>
				<template #background
					><ImageCardBackground
						:atlas="acgBackgroundAtlas"
						:focus-active="!isAcgMenuOpen"
						:options="{
							density: 0.7,
							blurLevel: 'clear',
							strengthLevel: 'distinct',
						}"
				/></template>
				<template #logo>
					<AcgCardCover :covers="acgCovers" :alt="acgCurrent.title" />
				</template>
				<template #title>{{ $t('main.index.card.acg.title') }}</template>
				<template #subtitle>
					<Transition name="preference-text" mode="out-in">
						<span :key="acgSubtitle" class="inline-block">{{
							acgSubtitle
						}}</span>
					</Transition>
				</template>
				<template #type>
					<div
						class="flex min-w-0 max-w-full items-center justify-center gap-1 px-4"
					>
						<span class="shrink-0">{{ $t('main.index.card.acg.type') }}</span>
						<PreferenceTrackLabel
							v-model:open="isAcgMenuOpen"
							:paused="!isAcgVisible || isAcgMenuOpen"
							:work="acgCurrent"
							:content-key="`${acgCurrent.id}:${locale}`"
							:label="acgCurrent.title"
							@read-window="deferAcg"
						/>
					</div>
				</template>
			</InfoCard>

			<InfoCard
				data-navigation-card="music"
				smooth-width
				:class="{ 'z-10': isMusicMenuOpen }"
				@visibility-change="isMusicVisible = $event"
			>
				<template #navigation="{ hovered, focused }">
					<CardNavigationHint
						:hovered="hovered"
						:focused="focused"
						to="/preference"
						label-key="main.index.card.navigation.music"
						:page-label="$t('main.index.card.navigation.pages.preference')"
					/>
				</template>
				<template #background
					><ImageCardBackground
						:atlas="musicBackgroundAtlas"
						:focus-active="!isMusicMenuOpen"
						:image-width="0.62"
						:options="{
							density: 0.7,
							rowStep: 0.74,
							layout: 'catalog',
							blurLevel: 'clear',
							strengthLevel: 'distinct',
						}"
				/></template>
				<template #logo>
					<MusicCardCover
						:cover="musicCover"
						:alt="`${musicCover.title} — ${musicCover.author.join(' / ')}`"
					/>
				</template>
				<template #title>{{ $t('main.index.card.music.title') }}</template>
				<template #subtitle>
					<Transition name="preference-slide" mode="out-in">
						<span :key="musicSubtitle" class="inline-block">{{
							musicSubtitle
						}}</span>
					</Transition>
				</template>
				<template #type>
					<div
						class="flex min-w-0 max-w-full items-center justify-center gap-1 px-4"
					>
						<span class="shrink-0">{{ $t('main.index.card.music.type') }}</span>
						<PreferenceTrackLabel
							v-model:open="isMusicMenuOpen"
							:paused="!isMusicVisible || isMusicMenuOpen"
							:work="musicCover"
							:content-key="`${musicCover.id}:${locale}`"
							:label="musicTrackLabel"
							:pixels-per-second="48"
							@read-window="deferMusic"
						/>
					</div>
				</template>
			</InfoCard>

			<InfoCard>
				<template #background
					><PersonalCardBackground theme="night"
				/></template>
				<template #logo>
					<SkeletonImage
						loading="eager"
						:reveal-cached-immediately="true"
						:src="onlineCoverUrl"
						:alt="$t('main.index.card.online.title')"
						class="block h-full w-full rounded-lg border border-slate-300/60 bg-slate-200/60 card-logo-glass backdrop-blur-none lg:backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-800/60"
						image-class="block h-full w-full rounded-lg object-cover"
						skeleton-class="rounded-lg"
					/>
				</template>
				<template #title>{{ $t('main.index.card.online.title') }}</template>
				<template #subtitle>
					<span
						class="inline-flex flex-nowrap items-center"
						@mouseleave="hoveredOnlineLink = null"
					>
						<NuxtLink
							to="https://space.bilibili.com/204271518"
							target="_blank"
							rel="noopener noreferrer"
							:class="onlineLinkClass(0)"
							@mouseenter="hoveredOnlineLink = 0"
						>
							{{ $t('main.index.card.online.bilibili') }}
						</NuxtLink>
						<span class="mx-1">/</span>
						<NuxtLink
							to="https://xhslink.com/m/9tlfAIy8eAJ"
							target="_blank"
							rel="noopener noreferrer"
							:class="onlineLinkClass(1)"
							@mouseenter="hoveredOnlineLink = 1"
						>
							{{ $t('main.index.card.online.xiaohongshu') }}
						</NuxtLink>
						<span class="mx-1">/</span>
						<NuxtLink
							to="https://github.com/AurLemon"
							target="_blank"
							rel="noopener noreferrer"
							:class="onlineLinkClass(2)"
							@mouseenter="hoveredOnlineLink = 2"
						>
							{{ $t('main.index.card.online.github') }}
						</NuxtLink>
					</span>
				</template>
				<template #type>{{ $t('main.index.card.online.type') }}</template>
			</InfoCard>

			<InfoCard>
				<template #background
					><PersonalCardBackground theme="language"
				/></template>
				<template #logo>
					<div
						class="relative h-full w-full overflow-hidden rounded-lg border border-slate-300/60 bg-slate-200/60 select-none card-logo-glass backdrop-blur-none lg:backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-800/60"
						role="img"
						:aria-label="$t('main.index.card.language.title')"
					>
						<span
							class="absolute left-1/8 bottom-2.5 -translate-x-1/2 text-[38px] leading-none"
							aria-hidden="true"
							>🇯🇵</span
						>
						<span
							class="absolute left-1/2 bottom-2.5 -translate-x-1/2 text-[46px] leading-none"
							aria-hidden="true"
							>🇺🇸</span
						>
						<span
							class="absolute left-5/6 bottom-1.5 -translate-x-1/2 text-[64px] leading-none"
							aria-hidden="true"
							>🇨🇳</span
						>
					</div>
				</template>
				<template #title>{{ $t('main.index.card.language.title') }}</template>
				<template #subtitle>{{
					$t('main.index.card.language.subtitle')
				}}</template>
				<template #type>{{ $t('main.index.card.language.type') }}</template>
			</InfoCard>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import InfoCard from '~/components/cards/InfoCard.vue'
import { useAcgPreference } from '~/composables/useAcgPreference'
import EducationCardBackground from '~/components/cards/EducationCardBackground.vue'
import TechnologyCardBackground from '~/components/cards/TechnologyCardBackground.vue'
import PersonalCardBackground from '~/components/cards/PersonalCardBackground.vue'
import ImageCardBackground from '~/components/cards/ImageCardBackground.vue'
import HighlightText from '~/components/common/HighlightText.vue'
import MobileCardNavigationStack from '~/components/cards/MobileCardNavigationStack.vue'

import avatarMark from '~/assets/resources/sitemark/avatar_mark.webp'
import FPMSLogo from '~/assets/resources/homepage/education/fpms.webp?w=320&q=90&thumbnail'
import FPMSAppearance from '~/assets/resources/homepage/education/fpms.webp?appearance'
import FEESLogo from '~/assets/resources/homepage/education/fees.webp?w=320&q=90&thumbnail'
import FEESAppearance from '~/assets/resources/homepage/education/fees.webp?appearance'
import FJCCCLogo from '~/assets/resources/homepage/education/fjccc.webp?w=320&q=90&thumbnail'
import FJCCCAppearance from '~/assets/resources/homepage/education/fjccc.webp?appearance'
import FJUTLogo from '~/assets/resources/homepage/education/fjut.webp?w=320&q=90&thumbnail'
import FJUTAppearance from '~/assets/resources/homepage/education/fjut.webp?appearance'

import techCoverUrl from '~/assets/resources/homepage/technology/cover.svg?url'
import acgBackgroundAtlas from '~/assets/resources/homepage/acg/background.card-atlas.json?atlas'
import AcgCardCover from '~/components/cards/AcgCardCover.vue'
import musicBackgroundAtlas from '~/assets/resources/homepage/music/background.card-atlas.json?atlas'
import MusicCardCover from '~/components/cards/MusicCardCover.vue'
import onlineCoverUrl from '~/assets/resources/homepage/night/cover.svg?url'

type EducationStage = 'bachelor' | 'specialty' | 'highSchool' | 'juniorSchool'

const { t, te, locale } = useI18n({ useScope: 'global' })
const cardGrid = ref<HTMLElement | null>(null)
const isAcgVisible = ref(false)
const isMusicVisible = ref(false)
const isAcgMenuOpen = ref(false)
const isMusicMenuOpen = ref(false)
const {
	covers: acgCovers,
	current: acgCurrent,
	deferFor: deferAcg,
} = useAcgPreference(computed(() => isAcgMenuOpen.value || !isAcgVisible.value))
const acgSubtitle = computed(() =>
	t(`main.index.card.acg.categories.${acgCurrent.value.category}.subtitle`),
)
const { cover: musicCover, deferFor: deferMusic } = useMusicPreference(
	computed(() => isMusicMenuOpen.value || !isMusicVisible.value),
)
const musicSongTitle = computed(() =>
	musicCover.value.category === 'chilichill'
		? musicCover.value.title.replace(/\s*[(（][^()（）]*[)）]\s*$/u, '')
		: musicCover.value.title,
)

const musicCategoryKey = computed(
	() => `main.index.card.music.categories.${musicCover.value.category}`,
)
const musicTrackLabel = computed(() => {
	const cover = musicCover.value
	const authors = ['vocaloid', 'chineseVocaloid', 'cnCreators'].includes(
		cover.category,
	)
		? ` (${cover.author.join(' / ')})`
		: ''
	return `${t(`${musicCategoryKey.value}.title`)} / ${musicSongTitle.value}${authors}`
})
const musicSubtitle = computed(() => t(`${musicCategoryKey.value}.subtitles.0`))

const profile = usePersonalProfile()
const introductionLine2 = computed(() => {
	const { age, studyYear } = profile.value
	const education = studyYear
		? t('main.index.educationSegment', {
				grade: te(`main.index.studyYears.${studyYear.level}.${studyYear.year}`)
					? t(`main.index.studyYears.${studyYear.level}.${studyYear.year}`)
					: t(`main.index.studyLabels.${studyYear.level}`),
			})
		: ''

	return t('main.index.line2', { age, education })
})

const line1DesktopSeparator = computed(() =>
	locale.value === 'en-US' ? ' ' : '',
)

// 从翻译后的名字插槽两侧读取文字，语言切换时同步调整高亮组合的间距。
const nameHighlightContext = computed(() => {
	const marker = '__HIGHLIGHT_NAME__'
	const introduction = t('main.index.line1Introduction', { name: marker })
	const [before = '', after = ''] = introduction.split(marker)

	return {
		before,
		desktopBefore: `${t('main.index.line1Lead')}${line1DesktopSeparator.value}${before}`,
		after: `${after}${t('main.index.line1Tail')}`,
	}
})

const educationStages: EducationStage[] = [
	'bachelor',
	'specialty',
	'highSchool',
	'juniorSchool',
]
const selectedEducationStage = useState<EducationStage>(
	'home-selected-education-stage',
	() => 'bachelor',
)
const hasEducationLogoSettled = ref(false)
const isEducationMenuOpen = ref(false)
const hoveredOnlineLink = ref<number | null>(null)

const educationLogos: Record<EducationStage, any> = {
	bachelor: FJUTLogo,
	specialty: FJCCCLogo,
	highSchool: FEESLogo,
	juniorSchool: FPMSLogo,
}

const getEducationStage = (stage: EducationStage) => {
	const baseKey = `main.index.card.education.stages.${stage}`
	const hintValue = te(`${baseKey}.hint`) ? t(`${baseKey}.hint`) : ''
	return {
		label: t(`${baseKey}.label`),
		title: t(`${baseKey}.title`),
		shortTitle: t(`${baseKey}.shortTitle`),
		subtitle: t(`${baseKey}.subtitle`),
		hint: hintValue ?? '',
	}
}

const currentEducationStage = computed(() =>
	getEducationStage(selectedEducationStage.value),
)

const currentEducationLogo = computed(
	() => educationLogos[selectedEducationStage.value],
)
const currentEducationLogoIsComponent = computed(
	() => typeof currentEducationLogo.value !== 'string',
)
const educationBackgroundBadges = [FPMSLogo, FJUTLogo, FEESLogo, FJCCCLogo]
const educationAppearanceProfiles = {
	[FPMSLogo]: FPMSAppearance,
	[FJUTLogo]: FJUTAppearance,
	[FEESLogo]: FEESAppearance,
	[FJCCCLogo]: FJCCCAppearance,
}

const isLogoComponent = (logo: any) => typeof logo !== 'string'

const handleEducationLogoReady = (): void => {
	hasEducationLogoSettled.value = true
}

const ONLINE_LINK_BASE_CLASS = 'text-slate-700 dark:text-slate-400'
const ONLINE_LINK_DIM_CLASS = 'text-slate-700/60 dark:text-slate-400/60'

const onlineLinkClass = (index: number) => [
	'transition-colors',
	hoveredOnlineLink.value === null
		? ONLINE_LINK_BASE_CLASS
		: hoveredOnlineLink.value === index
			? ONLINE_LINK_BASE_CLASS
			: ONLINE_LINK_DIM_CLASS,
]
</script>

<style scoped>
@media (hover: none) {
	.card-logo-glass {
		backdrop-filter: none;
	}
}
.preference-slide-enter-active,
.preference-slide-leave-active {
	transition:
		opacity 260ms ease,
		filter 260ms ease,
		transform 260ms ease;
}
.preference-slide-leave-active {
	/* 作品名先开始交接，副标题稍后以略慢的节奏接上。 */
	transition-delay: 120ms;
}
.preference-slide-enter-from {
	opacity: 0;
	filter: blur(4px);
	transform: translateX(-12px);
}
.preference-slide-leave-to {
	opacity: 0;
	filter: blur(4px);
	transform: translateX(12px);
}
@media (prefers-reduced-motion: reduce) {
	.preference-slide-enter-active,
	.preference-slide-leave-active {
		transition: none;
	}
	.preference-slide-enter-from,
	.preference-slide-leave-to {
		transform: none;
		filter: none;
	}
}

.preference-text-enter-active,
.preference-text-leave-active {
	transition:
		opacity 260ms ease,
		filter 260ms ease;
}
.preference-text-leave-active {
	transition-delay: 120ms;
}
.preference-text-enter-from,
.preference-text-leave-to {
	opacity: 0;
	filter: blur(4px);
}
@media (prefers-reduced-motion: reduce) {
	.preference-text-enter-active,
	.preference-text-leave-active {
		transition: none;
	}
	.preference-text-enter-from,
	.preference-text-leave-to {
		filter: none;
	}
}
</style>
