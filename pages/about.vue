<template>
    <div class="aurle-about aurle-page">
        <div class="aurle-page-container">
            <ContentRenderer v-if="about" :value="about" class="aurle-page-content" />
            <div class="aurle-page-content" v-else>正在加载内容</div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const { data: about } = await useAsyncData(() => queryCollection('content').path('/about').first())

useHead({
    title: '关于 / AurLemon Intro',
    meta: [
        { name: 'description', content: '关于本站的故事。' }
    ]
})
</script>

<style scoped lang="scss">
    @use '~/assets/styles/media_screen.scss' as media;

    .aurle-about {
        .aurle-page-container {
            padding: 1rem;

            @include media.media-screen(mobile) {
                padding: 1rem 2rem;
            }
        }
    }
</style>