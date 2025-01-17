<script setup lang="ts">
import { ref } from 'vue'
</script>

<template>
    <div class="aurle-home-flow">
        <div class="aurle-home-item">
        </div>
    </div>
</template>

<style lang="scss">
    @use '~/assets/styles/media_screen.scss' as media;

    .aurle-home-flow {
        width: 100%;
        height: 100%;
        max-width: 360px;
        max-height: 80px;
        border: 1px solid var(--border-color-base);
        border-radius: 12px;
        margin: 0 auto;
    }
</style>