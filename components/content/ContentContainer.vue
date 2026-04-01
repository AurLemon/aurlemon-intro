<template>
    <div class="aurle-content-container">
        <div class="aurle-content-info">
            <div class="aurle-content-title" v-if="title">{{ title }}</div>
            <div class="aurle-content-subtitle" v-if="subtitle">{{ subtitle }}</div>
        </div>
        <div class="aurle-content-wrapper">
            <ContentRenderer v-if="content" :value="content" class="aurle-content-render" />
        </div>
        <slot></slot>
    </div>
</template>

<script setup lang="ts">
const props = defineProps({
    page: {
        type: String,
        require: true
    },
    title: {
        type: String
    },
    subtitle: {
        type: String
    }
})

const { data: content } = await useAsyncData(() => queryCollection('content').path('/' + props.page).first())
</script>

<style scoped lang="scss">
    @use '~/assets/styles/media_screen.scss' as media;

    .aurle-content-container {
        display: flex;
        flex-direction: column;
        padding: 1.5rem;
        margin-bottom: 3rem;

        .aurle-content-info {
            padding: 3rem 0;

            .aurle-content-title {
                font-size: 2.25em;
                font-weight: 700;
                font-family: 'SourceHanSerif', serif;
            }

            .aurle-content-subtitle {
                color: var(--color-text--weaken);
                font-size: 1em;
                margin: 0 0.125rem;
            }
        }

        .aurle-content-wrapper {
            display: flex;
            gap: 1rem;

            .aurle-content-render {
                flex: 1;
            }
        }
    }
</style>

<style lang="scss">
    @import url('~/assets/styles/content.scss');
</style>
