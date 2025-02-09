<template>
    <main class="aurle-page-container">
        <NuxtPage />
        <InfoAnnouncement />
    </main>
</template>

<script setup lang="ts">
import InfoAnnouncement from './common/InfoAnnouncement.vue';
</script>

<style scoped lang="scss">
    .aurle-page-container {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        position: relative;
    }

    .page-enter-active,
    .page-leave-active {
        transition: opacity 160ms;
    }

    .page-enter-from {
        opacity: 0;
    }

    .page-leave-to {
        opacity: 0;
    }
</style>