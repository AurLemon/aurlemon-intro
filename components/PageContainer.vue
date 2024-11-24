<script setup lang="ts">
import InfoAnnouncement from './common/InfoAnnouncement.vue';
</script>

<template>
    <main class="aurle-page-container">
        <NuxtPage />
        <InfoAnnouncement />
    </main>
</template>

<style scoped lang="scss">
    .aurle-page-container {
        flex: 1;
        display: flex;
        margin: 0 1.25rem;
        margin-top: 3rem;
        position: relative;
    }
</style>