<template>
	<div>
		<ContentHeader :bg-src="aboutCover" :title="$t('menu.about')" />
		<ContentContainer page="about" />
	</div>
</template>

<script setup lang="ts">
import ContentHeader from '~/components/ContentHeader.vue'
import ContentContainer from '~/components/ContentContainer.vue'
import aboutCover from '~/assets/resources/pages/about_cover.webp'
</script>
