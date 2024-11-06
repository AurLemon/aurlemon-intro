<script setup lang="ts">
import PageSidebar from './components/PageSidebar.vue';
import PageContainer from './components/PageContainer.vue';
</script>

<template>
  <div class="aurle-app">
    <PageSidebar />
    <PageContainer />
  </div>
</template>

<style lang="scss" scoped>
  .aurle-app {
    display: flex;
    width: 100%;
    min-height: 100vh;
  }
</style>