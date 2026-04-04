<template>
	<div>
		<ContentHeader :bg-src="preferenceCover" :title="$t('menu.preference')"
			>👍😋👍
		</ContentHeader>
		<ContentContainer page="preference" />
	</div>
</template>

<script setup lang="ts">
import ContentHeader from '~/components/ContentHeader.vue'
import ContentContainer from '~/components/ContentContainer.vue'
import preferenceCover from '~/assets/resources/pages/preference_cover.webp'
</script>
