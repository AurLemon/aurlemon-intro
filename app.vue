<script setup lang="ts">
import PageHeader from './components/PageHeader.vue';
import PageSidebar from './components/PageSidebar.vue';
import PageContainer from './components/PageContainer.vue';
import PageFooter from './components/PageFooter.vue';
</script>

<template>
  <div class="aurle-app">
    <PageHeader />
    <PageSidebar />
    <PageContainer />
    <PageFooter />
  </div>
</template>

<style lang="scss" scoped>
  .aurle-app {
    display: flex;
    flex-direction: column;
    width: 100%;
    min-height: 100vh;
  }
</style>