<template>
	<footer
		class="mx-auto max-w-4xl w-full flex flex-col justify-between md:flex-row px-6 md:px-0 my-6 mb-16 mt-auto"
	>
		<SiteMark />
		<div
			class="mt-3 md:mt-0 break-all flex flex-wrap gap-x-2 md:items-center md:gap-x-4 text-[15px] text-slate-800 dark:text-slate-200 tracking-wide"
			@mouseleave="hoveredLink = null"
		>
			<NuxtLink to="/about" :class="linkClass(0)" @mouseenter="hoveredLink = 0">
				{{ $t('footer.aboutSite') }}
			</NuxtLink>
			<NuxtLink
				to="/friends"
				:class="linkClass(1)"
				@mouseenter="hoveredLink = 1"
			>
				{{ $t('footer.friendLink') }}
			</NuxtLink>
			<NuxtLink
				to="https://github.com/AurLemon"
				target="_blank"
				rel="noopener noreferrer"
				:class="linkClass(2)"
				@mouseenter="hoveredLink = 2"
			>
				{{ $t('footer.githubProfile') }}
			</NuxtLink>
			<NuxtLink
				to="https://beian.miit.gov.cn"
				target="_blank"
				rel="noopener noreferrer"
				:class="linkClass(3)"
				@mouseenter="hoveredLink = 3"
			>
				{{ $t('footer.miitRegistration') }}
			</NuxtLink>
		</div>
	</footer>
</template>

<script setup lang="ts">
import { ref } from 'vue'

import SiteMark from '~/components/AurLemon.vue'

const hoveredLink = ref<number | null>(null)

const linkClass = (index: number) => [
	'transition-colors',
	hoveredLink.value === null
		? 'text-slate-800 dark:text-slate-200'
		: hoveredLink.value === index
			? 'text-slate-800 dark:text-slate-200'
			: 'text-slate-500 dark:text-slate-400',
]
</script>
