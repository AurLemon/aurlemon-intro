<script setup lang="ts">
import PageHeader from '~/layouts/PageHeader.vue'
import PageContainer from '~/layouts/PageContainer.vue'
import PageFooter from '~/layouts/PageFooter.vue'
import PageMenu from '~/layouts/PageMenu.vue'

const { locale } = useI18n()

useHead(() => ({
	htmlAttrs: {
		lang: locale.value,
	},
}))
</script>

<template>
	<UApp>
		<div class="flex flex-col min-h-[105vh]">
			<PageHeader />
			<PageContainer />
			<PageFooter />
			<PageMenu />
		</div>
	</UApp>
</template>
