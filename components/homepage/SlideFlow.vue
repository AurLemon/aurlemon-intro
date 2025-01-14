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
        mask-image: linear-gradient(to bottom, transparent, #fff);
        opacity: 0.75;
        transform: perspective(700px) rotateX(55deg);
        transform-origin: bottom;
        transform-style: preserve-3d;
        will-change: transform;
    }
</style>