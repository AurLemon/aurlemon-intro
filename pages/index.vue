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
			<div class="relative h-42 w-42">
				<SkeletonImage
					:src="avatarMark"
					alt="AurLemon avatar"
					class="block h-full w-full rounded-full border-2 border-[#236F95] shadow-[0_0_32px_rgba(190,215,212,0.6)] dark:shadow-[0_0_32px_rgba(190,215,212,0.1)]"
					image-class="block h-full w-full rounded-full select-none"
					skeleton-class="rounded-full"
				/>
			</div>
			<div
				class="mt-6 text-4xl font-serif text-slate-900 dark:text-slate-100 font-medium leading-snug"
			>
				<span>{{ line1Parts[0] }}</span>
				<span class="hidden sm:inline">{{ line1DesktopSeparator }}</span>
				<br class="sm:hidden" />
				<span>{{ line1Parts[1] }}</span
				><span class="text-xl">{{ $t('main.index.lemonEmoji') }}</span
				><span>{{ line1Tail }}</span>
				<br />
				<span class="block mt-3 lg:mt-0 break-all"
					>{{ line2Parts.before
					}}<span class="text-xl italic">{{ $t('main.index.doubtful') }}</span
					>{{ line2Parts.after }}</span
				>
			</div>
		</div>

		<!-- 信息卡片 -->
		<div class="mt-16 pb-10 grid grid-cols-1 lg:grid-cols-2 gap-5">
			<div class="relative">
				<InfoCard
					:background-src="currentEducationBg"
					:content-key="selectedEducationStage"
				>
					<template #logo>
						<SkeletonImage
							v-if="!currentEducationLogoIsComponent"
							:src="String(currentEducationLogo)"
							:alt="currentEducationStage.title"
							:show-skeleton="!hasEducationLogoSettled"
							class="block h-full w-full"
							image-class="block h-full w-full rounded-lg object-cover"
							skeleton-class="rounded-lg"
							loading="eager"
							@ready="handleEducationLogoReady"
						/>
						<component v-else :is="currentEducationLogo" class="block" />
					</template>
					<template #title>{{ currentEducationStage.title }}</template>
					<template #subtitle>{{ currentEducationStage.subtitle }}</template>
					<template #type>
						<div class="flex items-center justify-center w-full">
							<span class="pr-1">
								{{ $t('main.index.card.education.type') }}
							</span>
							<UPopover
								:popper="{ placement: 'bottom-end' }"
								:ui="{ content: 'z-[40000]' }"
							>
								<UButton
									variant="link"
									color="neutral"
									class="font-semibold text-xs p-0 gap-0 cursor-pointer"
								>
									{{ currentEducationStage.label }}
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

			<InfoCard :background-src="techBg" :darkInvert="true">
				<template #logo>
					<SkeletonImage
						:src="techCoverUrl"
						:alt="$t('main.index.card.tech.title')"
						class="block h-full w-full"
						image-class="block h-full w-full rounded-lg object-cover"
						skeleton-class="rounded-lg"
					/>
				</template>
				<template #title>{{ $t('main.index.card.tech.title') }}</template>
				<template #subtitle>{{ $t('main.index.card.tech.subtitle') }}</template>
				<template #type>{{ $t('main.index.card.tech.type') }}</template>
			</InfoCard>

			<InfoCard :background-src="acgPreferenceBg">
				<template #logo>
					<SkeletonImage
						:src="acgPreferenceCover"
						:alt="$t('main.index.card.acg.title')"
						class="block h-full w-full"
						image-class="block h-full w-full rounded-lg object-cover"
						skeleton-class="rounded-lg"
					/>
				</template>
				<template #title>{{ $t('main.index.card.acg.title') }}</template>
				<template #subtitle>{{ $t('main.index.card.acg.subtitle') }}</template>
				<template #type>{{ $t('main.index.card.acg.type') }}</template>
			</InfoCard>

			<InfoCard :background-src="musicPreferenceBg">
				<template #logo>
					<SkeletonImage
						:src="musicPreferenceCover"
						:alt="$t('main.index.card.music.title')"
						class="block h-full w-full rounded-lg border border-slate-300/60"
						image-class="block h-full w-full rounded-lg object-cover"
						skeleton-class="rounded-lg"
					/>
				</template>
				<template #title>{{ $t('main.index.card.music.title') }}</template>
				<template #subtitle>{{
					$t('main.index.card.music.subtitle')
				}}</template>
				<template #type>{{ $t('main.index.card.music.type') }}</template>
			</InfoCard>

			<InfoCard :background-src="onlineBg" :darkInvert="true">
				<template #logo>
					<SkeletonImage
						:src="onlineCoverUrl"
						:alt="$t('main.index.card.online.title')"
						class="block h-full w-full rounded-lg border border-slate-300/60 bg-slate-200/60 backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-800/60"
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

			<InfoCard
				:background-src="languageAbilityBg"
				:darkInvert="true"
				:backgroundBlur="2"
			>
				<template #logo>
					<SkeletonImage
						:src="languageAbilityCover"
						:alt="$t('main.index.card.language.title')"
						class="block h-full w-full rounded-lg border border-slate-300/60 bg-slate-200/60 backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-800/60"
						image-class="block h-full w-full rounded-lg object-cover"
						skeleton-class="rounded-lg"
					/>
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
import dayjs from 'dayjs'
import InfoCard from '~/components/cards/InfoCard.vue'

import avatarMark from '~/assets/resources/sitemark/avatar_mark.webp'
import FPMLogo from '~/assets/resources/school_badge/FPM.webp'
import FEESLogo from '~/assets/resources/school_badge/FEES.webp'
import FJCCCLogo from '~/assets/resources/school_badge/FJCCC.webp'
import FJUTLogo from '~/assets/resources/school_badge/FJUT.webp'

import educationBg from '~/assets/resources/homepage/education_bg.webp'
import techCoverUrl from '~/assets/resources/homepage/tech_cover.svg?url'
import techBg from '~/assets/resources/homepage/tech_bg.webp'
import acgPreferenceBg from '~/assets/resources/homepage/acg_preference_bg.webp'
import acgPreferenceCover from '~/assets/resources/homepage/acg_preference_cover.webp'
import musicPreferenceBg from '~/assets/resources/homepage/music_preference_bg.webp'
import musicPreferenceCover from '~/assets/resources/homepage/music_preference_cover.webp'
import onlineBg from '~/assets/resources/homepage/online_bg.webp'
import onlineCoverUrl from '~/assets/resources/homepage/online_cover.svg?url'
import languageAbilityBg from '~/assets/resources/homepage/language_ability_bg.webp'
import languageAbilityCover from '~/assets/resources/homepage/language_ability_cover.webp'

type EducationStage = 'bachelor' | 'specialty' | 'highSchool' | 'juniorSchool'

const { t, te, locale } = useI18n({ useScope: 'global' })

const age = dayjs().diff('2006-05-18', 'year')

const line1Parts = computed(() => {
	const line1 = `${String(t('main.index.line1BeforeEmoji'))}${String(t('main.index.line1AfterEmoji'))}`
	const [first = '', second = ''] = line1.split('/').map((part) => part.trim())

	return [first, second]
})

const line1Tail = computed(() => String(t('main.index.line1Tail')))

const line1DesktopSeparator = computed(() =>
	locale.value === 'en-US' ? ' ' : '',
)

const line2Parts = computed(() => {
	return {
		before: String(t('main.index.line2BeforeDoubtful')),
		after: String(t('main.index.line2AfterDoubtful', { age })),
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
const hoveredOnlineLink = ref<number | null>(null)

const educationLogos: Record<EducationStage, any> = {
	bachelor: FJUTLogo,
	specialty: FJCCCLogo,
	highSchool: FEESLogo,
	juniorSchool: FPMLogo,
}

const getEducationStage = (stage: EducationStage) => {
	const baseKey = `main.index.card.education.stages.${stage}`
	const hintValue = te(`${baseKey}.hint`) ? t(`${baseKey}.hint`) : ''
	return {
		label: t(`${baseKey}.label`),
		title: t(`${baseKey}.title`),
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
const currentEducationBg = educationBg

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
