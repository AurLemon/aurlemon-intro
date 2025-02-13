<template>
    <div class="aurle-profile aurle-page">
        <ContentContainer page="profile" title="成分" subtitle="做一颗好的螺丝钉。"/>
    </div>
</template>

<script setup lang="ts">
import ContentContainer from '~/components/content/ContentContainer.vue'

useHead({
    title: '成分 / AurLemon Intro',
    meta: [
        { name: 'description', content: '查查我的成分。' }
    ]
})
</script>