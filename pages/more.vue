<template>
    <div class="aurle-more aurle-page">
        <ContentContainer page="more" title="更多" subtitle="还有很多事这里写不下 →_→"/>
    </div>
</template>

<script setup lang="ts">
import ContentContainer from '~/components/content/ContentContainer.vue'

useHead({
    title: '更多 / AurLemon Intro',
    meta: [
        { name: 'description', content: '网站的一些其他信息喵。' }
    ]
})
</script>