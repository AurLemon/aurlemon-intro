<template>
	<div>
		<ContentHeader :bg-src="preferenceCover" :title="$t('menu.preference')"
			>👍😋👍
		</ContentHeader>
		<ContentContainer page="preference" />
	</div>
</template>

<script setup lang="ts">
import ContentHeader from '~/components/content/ContentHeader.vue'
import ContentContainer from '~/components/content/ContentContainer.vue'
import preferenceCover from '~/assets/resources/pages/preference_cover.webp'
</script>
