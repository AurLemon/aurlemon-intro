<script setup lang="ts">
import InfoPanel from './components/InfoPanel.vue'
import PageHeader from './components/PageHeader.vue'
import PageContainer from './components/PageContainer.vue'
import PageFooter from './components/PageFooter.vue'
</script>

<template>
	<UApp>
		<div class="aurle-app">
			<InfoPanel />
			<PageHeader />
			<PageContainer />
			<PageFooter />
		</div>
	</UApp>
</template>

<style scoped lang="scss">
.aurle-app {
	display: flex;
	flex-direction: column;
	width: 100%;
	min-height: 100vh;
}
</style>
