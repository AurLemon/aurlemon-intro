<script setup lang="ts">
import { ref } from 'vue'

const projectInfo = ref<{
    id: number
    name: string
    desc: string
    tags: {
        badge: string
        name: string
    }[]
    url: {
        platform: string
        url: string
    }[]
    image: string
}[] | null>(null)
</script>

<template>
    <div class="aurle-home-tag project-show" v-tooltip.top="{ content: '项目展示' }">
        <div class="aurle-home-tag__list">
            <div class="aurle-home-tag__item">
                <div class="aurle-home-tag__background">
                    <img src="/assets/images/homepage/project-show/teps_background.webp">
                </div>
                <div class="aurle-home-tag__foreground">
                    <div class="aurle-home-tag__tags">
                        <div class="aurle-home-tag__tag">
                            <img src="https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white">
                        </div>
                        <div class="aurle-home-tag__tag">
                            <img src="https://img.shields.io/badge/Vue.js%203-4FC08D?logo=vue.js&logoColor=white">
                        </div>
                        <div class="aurle-home-tag__tag">
                            <img src="https://img.shields.io/badge/NestJS-E0234E?logo=nestjs&logoColor=white">
                        </div>
                    </div>
                    <div class="aurle-home-tag__title">船政转轨考の刷题系统</div>
                    <div class="aurle-home-tag__subtitle">5月那会给船政整的因为觉得原来那个太 SB 了。</div>
                    <div class="aurle-home-tag__links">
                        <div class="aurle-home-tag__link" v-tooltip="{ content: 'B 站' }">
                            <a href="https://www.bilibili.com/video/BV1Fjm6Y3EJ2" target="_blank" rel="noopener noreferrer">
                                <fa :icon="['fab', 'bilibili']" />
                            </a>
                        </div>
                        <div class="aurle-home-tag__link" v-tooltip="{ content: 'GitHub' }">
                            <a href="https://github.com/AurLemon/fjcpc-transfer-exam-practice-system" target="_blank" rel="noopener noreferrer">
                                <fa :icon="['fab', 'github']" />
                            </a>
                        </div>
                        <div class="aurle-home-tag__link" v-tooltip="{ content: '部署网站' }" rel="noopener noreferrer">
                            <a href="https://fjcpc-teps.aurlemon.top" target="_blank">
                                <fa :icon="['fas', 'globe']" />
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
    @use '~/assets/styles/module/tags_global' as tags;

    .aurle-home-tag.project-show {
        min-width: 300px;

        .aurle-home-tag__list {
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            align-items: center;
            position: relative;

            .aurle-home-tag__item {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                width: 100%;
                height: 100%;
                transition: 350ms;

                .aurle-home-tag__background {
                    img {
                        display: block;
                        width: 100%;
                        height: 100%;
                        object-fit: cover
                    }
                }

                .aurle-home-tag__foreground {
                    justify-content: flex-end;
                    padding: 0.75rem;
                    background: linear-gradient(35deg, var(--color-surface-0) 5%, transparent);
                    backdrop-filter: blur(0.5px) saturate(1.5);
                    transition: 350ms;
                    
                    .aurle-home-tag__tags {
                        display: flex;
                        gap: 0.25rem;

                        .aurle-home-tag__tag {
                            img {
                                display: block;
                                width: 100%;
                                height: 15px;
                                border-radius: 4px;
                                user-select: none;
                            }
                        }
                    }

                    .aurle-home-tag__title {
                        color: var(--color-text--emphasized);
                        font-size: 20px;
                        font-weight: 600;
                    }

                    .aurle-home-tag__subtitle {
                        color: var(--color-text--subtle);
                        line-height: 1;
                    }
                    
                    .aurle-home-tag__links {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 0.25rem;
                        position: absolute;
                        top: 0.5rem;
                        right: 0.5rem;

                        .aurle-home-tag__link {
                            a {
                                display: block;
                                padding: 4px;
                                border-radius: 50%;
                                transition: 350ms;

                                &:hover {
                                    background: var(--border-color-base--darker);
                                }
                            }

                            svg {
                                display: block;
                                color: var(--color-text);
                                width: 14px;
                                height: 14px;
                                object-fit: cover;
                            }
                        }
                    }
                }

                &:hover {
                    .aurle-home-tag__foreground {
                        backdrop-filter: blur(0px) saturate(1);
                    }
                }
            }
        }
    }
</style>