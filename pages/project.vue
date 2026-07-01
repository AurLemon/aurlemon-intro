<template>
	<ContentPage
		:bg-src="projectCover"
		:title="$t('menu.project')"
		page="project"
	>
		<openaiLogo class="h-5 text-slate-900 dark:text-white mr-1" />
		{{ $t('main.project.line1') }}
	</ContentPage>
</template>

<script setup lang="ts">
import ContentPage from '~/components/content/ContentPage.vue'
import projectCover from '~/assets/resources/pages/project_cover.webp'
import openaiLogo from '~/assets/resources/brand/openai_logo.svg'
</script>
