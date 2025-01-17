<template>
    <div class="aurle-project aurle-page">
        <div class="aurle-page-container">
            <ContentRenderer v-if="project" :value="project" class="aurle-page-content" />
            <div class="aurle-page-content" v-else>正在加载内容</div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const { data: project } = await useAsyncData(() => queryCollection('content').path('/project').first())

useHead({
    title: '项目 / AurLemon Intro',
    meta: [
        { name: 'description', content: '我的一些项目和作品。' }
    ]
})
</script>

<style scoped lang="scss">
    .aurle-project {
    }
</style>