<template>
    <div class="aurle-friends aurle-page">
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

useHead({
    title: '朋友们 / AurLemon Intro',
    meta: [
        { name: 'description', content: '这是我的宝贝们。' }
    ]
})
</script>

<style scoped lang="scss">
    @use '~/assets/styles/media_screen.scss' as media;

    .aurle-friends {
        .aurle-page-container {
            padding: 1rem;
        }
    }
</style>