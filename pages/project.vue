<template>
	<div>
		<ContentHeader :bg-src="projectCover" :title="$t('menu.project')">
			<openaiLogo class="h-5 text-slate-900 dark:text-white mr-1" />
			{{ $t('main.project.line1') }}
		</ContentHeader>
		<ContentContainer page="project" />
	</div>
</template>

<script setup lang="ts">
import ContentHeader from '~/components/content/ContentHeader.vue'
import ContentContainer from '~/components/content/ContentContainer.vue'
import projectCover from '~/assets/resources/pages/project_cover.webp'
import openaiLogo from '~/assets/resources/brand/openai_logo.svg'
</script>
