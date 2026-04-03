<template>
	<footer
		class="mx-auto max-w-4xl w-full flex flex-col justify-between md:flex-row px-6 md:px-0 my-6 mb-12 mt-auto"
	>
		<SiteMark />
		<div
			class="mt-3 md:mt-0 break-all flex flex-wrap gap-x-2 md:items-center md:gap-x-4 text-[15px] text-slate-800 dark:text-slate-200 tracking-wide"
		>
			<NuxtLink
				to="/about"
				class="hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
			>
				{{ $t('footer.aboutSite') }}
			</NuxtLink>
			<NuxtLink
				to="/friends"
				class="hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
			>
				{{ $t('footer.friendLink') }}
			</NuxtLink>
			<NuxtLink
				to="https://github.com/AurLemon"
				target="_blank"
				rel="noopener noreferrer"
				class="hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
			>
				{{ $t('footer.githubProfile') }}
			</NuxtLink>
			<NuxtLink
				to="https://beian.miit.gov.cn"
				target="_blank"
				rel="noopener noreferrer"
				class="hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
			>
				{{ $t('footer.miitRegistration') }}
			</NuxtLink>
		</div>
	</footer>
</template>

<script setup lang="ts">
import SiteMark from '~/components/AurLemon.vue'
</script>
