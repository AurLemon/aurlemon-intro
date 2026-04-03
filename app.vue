<script setup lang="ts">
import PageHeader from '~/layouts/PageHeader.vue'
import PageContainer from '~/layouts/PageContainer.vue'
import PageFooter from '~/layouts/PageFooter.vue'
</script>

<template>
	<UApp>
		<div class="mx-auto max-w-4xl flex flex-col min-h-[105vh]">
			<PageHeader />
			<PageContainer />
			<PageFooter />
		</div>
	</UApp>
</template>
