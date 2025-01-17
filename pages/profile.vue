<template>
    <div class="aurle-profile aurle-page">
        <div class="aurle-page-container">
            <ContentRenderer v-if="profile" :value="profile" class="aurle-page-content" />
            <div class="aurle-page-content" v-else>正在加载内容</div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const { data: profile } = await useAsyncData(() => queryCollection('content').path('/profile').first())

useHead({
    title: '成分 / AurLemon Intro',
    meta: [
        { name: 'description', content: '查查我的成分。' }
    ]
})
</script>

<style scoped lang="scss">
    .aurle-profile {
    }
</style>