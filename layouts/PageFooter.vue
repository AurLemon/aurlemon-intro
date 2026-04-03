<template>
	<footer class="flex flex-col justify-between md:flex-row my-6 mb-12 mt-auto">
		<SiteMark />
		<div
			class="flex flex-col gap-2 md:flex-row md:items-center md:gap-4 text-[15px] text-slate-800 dark:text-slate-200 tracking-wide"
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
