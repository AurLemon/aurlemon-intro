<template>
    <div class="aurle-content-container">
        <div class="aurle-content-info">
            <div class="aurle-content-title" v-if="title">{{ title }}</div>
            <div class="aurle-content-subtitle" v-if="subtitle">{{ subtitle }}</div>
        </div>
        <div class="aurle-content-wrapper">
            <ContentRenderer v-if="content" :value="content" class="aurle-content-render" />
            <TableOfContents v-if="content" :toc="content.body.toc" :title="title" class="aurle-content-toc" />
        </div>
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

        .aurle-content-info {
            padding-top: 6em;
            padding-bottom: 4em;

            .aurle-content-title {
                font-size: 2.25em;
                font-weight: 700;
                font-family: serif;
            }

            .aurle-content-subtitle {
                color: var(--color-text--weaken);
                font-size: 1em;
                margin: 0 0.125em;
            }
        }

        .aurle-content-wrapper {
            display: flex;
            gap: 1em;

            @include media.media-screen(mobile) {
                flex-direction: column-reverse;
            }
        }
    }
</style>

<style lang="scss">
    @use '~/assets/styles/media_screen.scss' as media;
    @import url('~/assets/styles/content.scss');

    .aurle-content-toc {
        $toc-transition-duration: 500ms;
        position: sticky;
        top: 120px;
        max-width: 100px;
        width: 100%;
        height: fit-content;
        word-break: keep-all;

        #toc-title {
            display: none;
        }

        ul {
            list-style-type: none;
            margin: 0;
            padding: 0;

            li {
                margin: 0.5em 0;

                .toc-item {
                    position: relative;

                    a {
                        display: block;
                        color: var(--color-text--weaken);
                        padding-left: 0.5em;
                        transition: $toc-transition-duration;
                        overflow: hidden;

                        &::after {
                            content: '';
                            position: absolute;
                            top: 0;
                            left: 0;
                            bottom: 0;
                            height: 100%;
                            width: 3px;
                            background: var(--color-primary);
                            border-radius: 8px;
                            transition: $toc-transition-duration;
                            opacity: 0;
                            transform: translateX(-4px) scale(0.8);
                        }
                    }

                    &:hover {
                        a {
                            color: var(--color-text);
                            padding-left: 0.625em;
                            transition-duration: 300ms;
                        }
                    }

                    &.active-toc-item {
                        a {
                            color: var(--color-text--emphasized);
                            font-weight: 500;
                            padding-left: 0.875em;

                            &::after {
                                opacity: 1;
                                transform: translateX(0) scale(1);
                            }
                        }
                    }
                }
            }
        }

        @include media.media-screen(mobile) {
            position: static;
        }
    }
</style>