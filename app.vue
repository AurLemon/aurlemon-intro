<script setup lang="ts">
import PageSidebar from './components/PageSidebar.vue';
import PageContainer from './components/PageContainer.vue';
import PageFooter from './components/PageFooter.vue';
</script>

<template>
  <div class="aurle-app">
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