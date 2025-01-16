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


<template>
    <div class="aurle-desc aurle-page">
        <ContentRenderer v-if="desc" :value="desc" />
        <div v-else>正在加载内容...</div>
    </div>
</template>

<style scoped lang="scss">
    .aurle-desc {
    }
</style>