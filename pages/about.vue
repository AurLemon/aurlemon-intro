<template>
	<ContentPage
		:bg-src="aboutCover"
		:title="$t('menu.about')"
		page="about"
		use-clean-slot
	>
		<SiteMark class="mb-4" />
	</ContentPage>
</template>

<script setup lang="ts">
import ContentPage from '~/components/content/ContentPage.vue'
import aboutCover from '~/assets/resources/pages/about_cover.webp'
import SiteMark from '~/components/branding/AurLemon.vue'
</script>
