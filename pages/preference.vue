<template>
	<ContentPage
		:bg-src="preferenceCover"
		:title="$t('menu.preference')"
		page="preference"
	>
		👍😋👍
	</ContentPage>
</template>

<script setup lang="ts">
import ContentPage from '~/components/content/ContentPage.vue'
import preferenceCover from '~/assets/resources/pages/preference_cover.webp'
</script>
