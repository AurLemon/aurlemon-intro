<template>
	<div>
		<ContentHeader
			:bg-src="aboutCover"
			:title="$t('menu.about')"
			:useCleanSlot="true"
		>
			<SiteMark class="mb-4" />
		</ContentHeader>
		<ContentContainer page="about" />
	</div>
</template>

<script setup lang="ts">
import ContentHeader from '~/components/content/ContentHeader.vue'
import ContentContainer from '~/components/content/ContentContainer.vue'
import aboutCover from '~/assets/resources/pages/about_cover.webp'
import SiteMark from '~/components/branding/AurLemon.vue'
</script>
