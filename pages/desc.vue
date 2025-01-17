<template>
    <div class="aurle-desc aurle-page">
        <div class="aurle-page-container">
            <ContentRenderer v-if="desc" :value="desc" class="aurle-page-content" />
            <div class="aurle-page-content" v-else>正在加载内容...</div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const { data: desc } = await useAsyncData(() => queryCollection('content').path('/desc').first())

useHead({
    title: '自述 / AurLemon Intro',
    meta: [
        { name: 'description', content: '瓦塔西的自述desu。' }
    ]
})
</script>

<style scoped lang="scss">
    @use '~/assets/styles/media_screen.scss' as media;

    .aurle-desc {
        .aurle-page-container {
            padding: 1rem;

            @include media.media-screen(mobile) {
                padding: 1rem 2rem;
            }
        }
    }
</style>