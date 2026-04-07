<template>
	<div>
		<ContentHeader :bg-src="profileCover" :title="$t('menu.profile')"
			>👎🤔👍
		</ContentHeader>
		<ContentContainer page="profile" />
	</div>
</template>

<script setup lang="ts">
import ContentHeader from '~/components/content/ContentHeader.vue'
import ContentContainer from '~/components/content/ContentContainer.vue'
import profileCoverLight from '~/assets/resources/pages/profile_cover_light.webp'
import profileCoverDark from '~/assets/resources/pages/profile_cover_dark.webp'

const colorMode = useColorMode()
const isMounted = ref(false)

onMounted(() => {
	isMounted.value = true
})

const profileCover = computed(() =>
	isMounted.value && colorMode.value === 'dark'
		? profileCoverDark
		: profileCoverLight,
)
</script>
