<template>
	<div>
		<ContentHeader :bg-src="profileCover" :title="$t('menu.profile')"
			>👎🤔👍
		</ContentHeader>
		<ContentContainer page="profile" />
	</div>
</template>

<script setup lang="ts">
import ContentHeader from '~/components/ContentHeader.vue'
import ContentContainer from '~/components/ContentContainer.vue'
import profileCover from '~/assets/resources/pages/profile_cover.webp'
</script>
