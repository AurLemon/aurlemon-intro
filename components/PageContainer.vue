<template>
    <main class="aurle-page-container" :class="{ 'top-background': isHomePage }">
        <NuxtPage />
        <InfoAnnouncement />
    </main>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import InfoAnnouncement from './common/InfoAnnouncement.vue'

const route = useRoute()

const isHomePage = ref(route.path !== '/')

watch(() => route.path, (newPath) => {
    isHomePage.value = newPath !== '/'
})
</script>

<style scoped lang="scss">
    .aurle-page-container {
        --top-background: var(--background-color-primary--active);
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        position: relative;

        &::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 500px;
            background: linear-gradient(180deg, var(--top-background) -50%, transparent 95%) no-repeat;
            opacity: 0;
            z-index: -1;
            transform: translateY(-50%) scaleY(0.8);
            transform-origin: top;
            transition: 500ms;
        }

        &.top-background {
            &::after {
                opacity: 1;
                transform: translateY(0) scaleY(1);
            }
        }
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