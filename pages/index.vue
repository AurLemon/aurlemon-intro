<template>
	<div class="mt-4">
		<!-- 顶部问候 -->
		<div class="mx-2">
			<img
				src="~/assets/sitemark/avatar_mark.jpg"
				class="block rounded-full h-42 border-[#236F95] border-2 select-none shadow-[0_0_32px_rgba(190,215,212,0.6)] dark:shadow-[0_0_32px_rgba(190,215,212,0.1)]"
			/>
			<div
				class="mt-6 text-4xl font-serif text-slate-900 dark:text-slate-100 font-medium leading-snug"
			>
				{{ $t('main.index.line1') }}<br />
				<i18n-t keypath="main.index.line2" tag="span">
					<template #age>{{ age }}</template>
					<template #doubtful>
						<span class="text-xl italic">{{ $t('main.index.doubtful') }}</span>
					</template>
				</i18n-t>
			</div>
		</div>

		<!-- 信息卡片 -->
		<div class="mt-10 pb-10 grid grid-cols-2 gap-5">
			<InfoCard :background-src="educationBg">
				<template #logo>
					<XMTULogo class="block" />
				</template>
				<template #title>{{ $t('main.index.card.education.title') }}</template>
				<template #subtitle>{{
					$t('main.index.card.education.subtitle')
				}}</template>
				<template #type>{{ $t('main.index.card.education.type') }}</template>
			</InfoCard>

			<InfoCard :background-src="techBg">
				<template #logo>
					<techCover class="block rounded-xl" />
				</template>
				<template #title>{{ $t('main.index.card.tech.title') }}</template>
				<template #subtitle>{{ $t('main.index.card.tech.subtitle') }}</template>
				<template #type>{{ $t('main.index.card.tech.type') }}</template>
			</InfoCard>

			<InfoCard :background-src="acgPreferenceBg">
				<template #logo>
					<img :src="acgPreferenceCover" class="block rounded-xl" />
				</template>
				<template #title>{{ $t('main.index.card.acg.title') }}</template>
				<template #subtitle>{{ $t('main.index.card.acg.subtitle') }}</template>
				<template #type>{{ $t('main.index.card.acg.type') }}</template>
			</InfoCard>

			<InfoCard :background-src="musicPreferenceBg">
				<template #logo>
					<img :src="musicPreferenceCover" class="block rounded-xl shadow" />
				</template>
				<template #title>{{ $t('main.index.card.music.title') }}</template>
				<template #subtitle>{{
					$t('main.index.card.music.subtitle')
				}}</template>
				<template #type>{{ $t('main.index.card.music.type') }}</template>
			</InfoCard>

			<InfoCard :background-src="onlineBg">
				<template #logo>
					<onlineCover class="block bg-slate-200/60 rounded-xl shadow" />
				</template>
				<template #title>{{ $t('main.index.card.online.title') }}</template>
				<template #subtitle>
					<NuxtLink
						to="https://space.bilibili.com/204271518"
						target="_blank"
						rel="noopener noreferrer"
						class="hover:text-slate-600/50 dark:hover:text-slate-200/50 transition-colors"
					>
						{{ $t('main.index.card.online.bilibili') }}
					</NuxtLink>
					<span>/</span>
					<NuxtLink
						to="https://xhslink.com/m/9tlfAIy8eAJ"
						target="_blank"
						rel="noopener noreferrer"
						class="hover:text-slate-600/50 dark:hover:text-slate-200/50 transition-colors"
					>
						{{ $t('main.index.card.online.xiaohongshu') }}
					</NuxtLink>
					<span>/</span>
					<NuxtLink
						to="https://github.com/AurLemon"
						target="_blank"
						rel="noopener noreferrer"
						class="hover:text-slate-600/50 dark:hover:text-slate-200/50 transition-colors"
					>
						{{ $t('main.index.card.online.github') }}
					</NuxtLink>
				</template>
				<template #type>{{ $t('main.index.card.online.type') }}</template>
			</InfoCard>

			<InfoCard :background-src="languageAbilityBg">
				<template #logo>
					<img
						:src="languageAbilityCover"
						class="block bg-slate-200/60 rounded-xl shadow"
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
import dayjs from 'dayjs'
import InfoCard from '~/components/InfoCard.vue'

import XMTULogo from '~/assets/resources/school_badge/XMTU.svg'
import educationBg from '~/assets/resources/homepage/education_bg.webp'
import techCover from '~/assets/resources/homepage/tech_cover.svg'
import techBg from '~/assets/resources/homepage/tech_bg.webp'
import acgPreferenceBg from '~/assets/resources/homepage/acg_preference_bg.webp'
import acgPreferenceCover from '~/assets/resources/homepage/acg_preference_cover.webp'
import musicPreferenceBg from '~/assets/resources/homepage/music_preference_bg.webp'
import musicPreferenceCover from '~/assets/resources/homepage/music_preference_cover.webp'
import onlineBg from '~/assets/resources/homepage/online_bg.webp'
import onlineCover from '~/assets/resources/homepage/online_cover.svg'
import languageAbilityBg from '~/assets/resources/homepage/language_ability_bg.webp'
import languageAbilityCover from '~/assets/resources/homepage/language_ability_cover.webp'

const age = dayjs().diff('2006-05-18', 'year')
</script>
