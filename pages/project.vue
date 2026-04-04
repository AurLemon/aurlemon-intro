<template>
	<div>
		<ContentHeader :bg-src="projectCover" :title="$t('menu.project')" />
		<ContentContainer page="project" />
	</div>
</template>

<script setup lang="ts">
import ContentHeader from '~/components/ContentHeader.vue'
import ContentContainer from '~/components/ContentContainer.vue'
import projectCover from '~/assets/resources/pages/project_cover.webp'
</script>
