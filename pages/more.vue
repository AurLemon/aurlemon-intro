<template>
    <div class="aurle-more aurle-page">
        <div class="aurle-page-container">
            <ContentRenderer v-if="more" :value="more" class="aurle-page-content" />
            <div class="aurle-page-content" v-else>正在加载内容</div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const { data: more } = await useAsyncData(() => queryCollection('content').path('/more').first())

useHead({
    title: '更多 / AurLemon Intro',
    meta: [
        { name: 'description', content: '网站的一些其他信息喵。' }
    ]
})
</script>

<style scoped lang="scss">
    .aurle-more {
    }
</style>