<template>
	<ContentPage
		:bg-src="journeyCover"
		:title="$t('menu.journey')"
		page="journey"
	>
		🛣️🫧🪞
	</ContentPage>
</template>

<script setup lang="ts">
import ContentPage from '~/components/content/ContentPage.vue'
import profileCoverLight from '~/assets/resources/pages/profile_cover_light.webp'
import profileCoverDark from '~/assets/resources/pages/profile_cover_dark.webp'

const colorMode = useColorMode()
const isMounted = ref(false)

onMounted(() => {
	isMounted.value = true
})

const journeyCover = computed(() =>
	isMounted.value && colorMode.value === 'dark'
		? profileCoverDark
		: profileCoverLight,
)
</script>
