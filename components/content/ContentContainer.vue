<template>
    <div class="aurle-content-container">
        <div class="aurle-content-info">
            <div class="aurle-content-title" v-if="title">{{ title }}</div>
            <div class="aurle-content-subtitle" v-if="subtitle">{{ subtitle }}</div>
        </div>
        <div class="aurle-content-wrapper" ref="contentElement">
            <ContentRenderer v-if="content" :value="content" class="aurle-content-render" />
            <div class="aurle-content-toc-wrapper">
                <TableOfContents v-if="content" :toc="content.body.toc" title="目录结构" class="aurle-content-toc" />
                <div class="aurle-content-toc__scroll">
                    <svg width="14" height="14">
                    <circle cx="7" cy="7" r="6" stroke-linecap="round" fill="none" stroke="var(--color-surface-1)" stroke-width="2"></circle>
                    <circle 
                        cx="7" cy="7" r="6" stroke-linecap="round" fill="none" 
                        stroke="var(--color-primary)" stroke-width="2"
                        stroke-dasharray="50" 
                        :stroke-dashoffset="50 - (contentScrollProgress / 100) * 50"
                        transform="rotate(-90 7 7)"
                    </circle>
                </svg>
                    {{ contentScrollProgress.toFixed(0) }}%
                </div>
            </div>
        </div>
        <slot></slot>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const contentScrollProgress = ref(0)
const contentElement = ref<HTMLElement>()

const calculateProgress = () => {
    if (contentElement.value) {
        const element = contentElement.value
        const elementHeight = element.getBoundingClientRect().height
        const elementTop = element.offsetTop
        const scrollTop = window.scrollY
        const viewportHeight = window.innerHeight
        
        let progress = (scrollTop - elementTop) / (elementHeight - viewportHeight) * 100
        
        if (progress < 0) {
            progress = 0
        } else if (progress > 100) {
            progress = 100
        }
        
        contentScrollProgress.value = progress
    }
}

onMounted(() => {
    calculateProgress()
    window.addEventListener('scroll', calculateProgress)
})

onUnmounted(() => {
    window.removeEventListener('scroll', calculateProgress)
})

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

            .aurle-content-toc__scroll {
                display: flex;
                align-items: center;
                gap: 0.5rem;

                svg * {
                    transition: 400ms;
                }
            }

            @include media.media-screen(mobile) {
                flex-direction: column-reverse;
            }
        }
    }
</style>

<style lang="scss">
    @use '~/assets/styles/media_screen.scss' as media;
    @import url('~/assets/styles/content.scss');

    .aurle-content-toc-wrapper {
        $toc-transition-duration: 500ms;
        position: sticky;
        top: 120px;
        height: fit-content;
        max-width: 120px;
        width: 100%;

        .aurle-content-toc {
            padding-bottom: 0.5rem;
            margin-bottom: 1rem;
            border-bottom: 1px solid var(--border-color-base--darker);
            word-break: keep-all;

            #toc-title {
                display: block;
                color: var(--color-text--subtle);
                font-size: 0.8125em;
                padding-bottom: 0.25rem;
            }

            ul {
                list-style-type: none;
                margin: 0;
                padding: 0;

                li {
                    margin: 0.5rem 0;

                    .toc-item {
                        position: relative;

                        a {
                            display: block;
                            color: var(--color-text--weaken);
                            padding-left: 0.5rem;
                            transition: $toc-transition-duration;
                            white-space: nowrap;
                            overflow: hidden;
                            text-overflow: ellipsis;

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
                                padding-left: 0.625rem;
                                transition-duration: 300ms;
                            }
                        }

                        &.active-toc-item {
                            a {
                                color: var(--color-text--emphasized);
                                font-weight: 500;
                                padding-left: 0.875rem;

                                &::after {
                                    opacity: 1;
                                    transform: translateX(0) scale(1);
                                }
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