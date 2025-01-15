<script setup lang="ts">
</script>

<template>
    <div class="aurle-home-flow">

    </div>
</template>

<style lang="scss">
    @use '~/assets/styles/media_screen.scss' as media;

    .aurle-home-flow {
        position: absolute;
        bottom: 0;
        z-index: 4;
        width: 100%;
        height: 300px;
        mask-image: radial-gradient(ellipse at bottom, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.15) 50%, transparent 70%);
        opacity: 0.75;
    }
</style>