<template>
    <div class="aurle-desc aurle-page">
        <ContentContainer page="desc" title="自述" subtitle="Ciallo～(∠・ω< )⌒★"/>
    </div>
</template>

<script setup lang="ts">
import ContentContainer from '~/components/content/ContentContainer.vue'

useHead({
    title: '自述 / AurLemon Intro',
    meta: [
        { name: 'description', content: '瓦塔西的自述desu。' }
    ]
})
</script>