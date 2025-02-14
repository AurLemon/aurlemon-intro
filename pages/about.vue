<template>
    <div class="aurle-about aurle-page">
        <ContentContainer page="about" title="关于" subtitle="一个用 Nuxt 3 写的、Shiro UI 风格的个人介绍站。" />
    </div>
</template>

<script setup lang="ts">
import ContentContainer from '~/components/content/ContentContainer.vue'

useHead({
    title: '关于 / AurLemon Intro',
    meta: [
        { name: 'description', content: '关于本站的故事。' }
    ]
})
</script>