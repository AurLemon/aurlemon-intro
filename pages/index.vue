<script setup lang="ts">
import { ref } from 'vue'
import dayjs from 'dayjs'

import GitHubRepo from '~/components/homepage/GitHubRepo.vue';
import HomeTags from '~/components/homepage/HomeTags.vue';
import { birthdate, atbeeExamDate } from '../utils/time'

useHead({
    meta: [
        { name: 'description', content: 'AurLemon 的介绍网站！' }
    ]
})
</script>

<template>
    <div class="aurle-home aurle-page">
        <div class="aurle-home-me">
            <div class="aurle-home-me__avatar" v-tooltip="{ content: '喜欢我吗？' }">
                <img src="../assets/images/AurLemon_Avatar.jpg" alt="">
            </div>
            <div class="aurle-home-me__name">
                <div class="aurle-home-me__info" translate="no">
                    <div class="aurle-home-me__username">AurLemon</div>
                    <div class="aurle-home-me__id">@AurLemon</div>
                </div>
                <div class="aurle-home-me__nick">
                    <div class="nick">柠檬</div>
                    <div class="simply-tag">{{ dayjs().diff(dayjs(birthdate), 'year') }}</div>
                    <div class="simply-tag">{{ dayjs().isAfter(dayjs(atbeeExamDate)) ? '臭二本的' : '臭大专的' }}</div>
                    <div class="simply-tag">INFJ/TJ</div>
                    <div class="simply-tag">福州</div>
                </div>
            </div>
        </div>
        <div class="aurle-home-section">
            <GitHubRepo />
            <HomeTags />
        </div>
        <div class="aurle-home-basic">
            <div class="aurle-home-contact-list">
                <div class="aurle-home-contact github">
                    <a href="https://github.com/AurLemon" target="_blank">
                        <img src="../assets/images/icons/GitHub_Logo.svg" alt="GitHub 账户">
                    </a>
                </div>
                <div class="aurle-home-contact bilibili">
                    <a href="https://space.bilibili.com/204271518" target="_blank">
                        <img src="../assets/images/icons/bilibili_Logo.svg" alt="B 站账户">
                    </a>
                </div>
                <div class="aurle-home-contact cnblogs">
                    <a href="https://cnblogs.com/AurLemon" target="_blank">
                        <img src="../assets/images/icons/cnblogs_Logo.svg" alt="博客园博客">
                    </a>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
    @use '~/assets/styles/media_screen.scss' as media;

    .aurle-home {
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;

        .aurle-home-me {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-top: 8rem;
            
            .aurle-home-me__avatar {
                border: 2px solid #ffca0c;
                border-radius: 50%;
                overflow: hidden;
                user-select: none;

                img {
                    $value-image-length: 88px;
                    display: block;
                    width: $value-image-length;
                    height: $value-image-length;
                    transition: 750ms;
                    transition-delay: 50ms;

                    &:hover {
                        transform: rotate(360deg);
                        filter: brightness(1.75) saturate(1.5);
                    }

                    @include media.media-screen(mobile) {
                        &:hover {
                            transform: unset;
                            filter: unset;
                        }
                    }
                }
            }

            .aurle-home-me__name {
                display: flex;
                flex-direction: column;
                gap: 0.25rem;

                .aurle-home-me__info {
                    display: flex;
                    align-items: baseline;
                    gap: 0.75rem;
                }

                .aurle-home-me__username {
                    color: transparent;
                    font-size: 64px;
                    font-weight: 600;
                    font-family: 'Caveat';
                    line-height: 1;
                }
            }

            .aurle-home-me__name {
                display: flex;
                flex-direction: column;
                gap: 0.25rem;

                .aurle-home-me__info {
                    display: flex;
                    align-items: baseline;
                    gap: 0.75rem;
                    transition: 350ms;
                    user-select: none;

                    &:hover {
                        text-shadow: 0 0 64px var(--color-primary);
                    }
                }

                .aurle-home-me__username {
                    color: transparent;
                    font-size: 64px;
                    font-weight: 600;
                    font-family: 'Caveat';
                    line-height: 1;
                    background: linear-gradient(60deg, var(--color-text) -15%, var(--color-primary) 225%);
                    background-clip: text;
                }

                .aurle-home-me__nick {
                    color: var(--color-text--subtle);
                    font-size: 14px;
                    display: flex;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 0.375rem;

                    .nick {
                        line-height: 1;
                    }

                    .simply-tag {
                        color: var(--color-text);
                        font-size: 10px;
                        padding: 2px 6px;
                        border-radius: 8px;
                        background: var(--background-color-primary--active);
                    }
                }

                .aurle-home-me__id {
                    color: var(--color-surface-4);
                    font-size: 16px;
                }
            }
        }
        
        .aurle-home-section {
            display: flex;
            align-items: center;
            flex-direction: column;
            gap: 1.75rem;
            margin-top: 4rem;
        }

        .aurle-home-basic {
            display: flex;
            align-items: center;
            flex-direction: column;
            gap: 0.25rem;
            padding: 2px 16px;
            margin-top: 2rem;

            .aurle-home-contact-list {
                display: flex;
                align-items: center;
                gap: 0.75rem;

                .aurle-home-contact {
                    padding: 0.25rem;
                    border-radius: 9999px;
                    transition: 150ms;
                    user-select: none;
                    cursor: pointer;

                    a {
                        display: flex;
                    }

                    img {
                        $value-image-length: 18px;
                        width: $value-image-length;
                        height: $value-image-length;
                    }

                    &:hover {
                        background: var(--border-color-base);
                    }

                    &:active {
                        transform: scale(0.9);
                    }
                }
            }
        }

        @include media.media-screen(mobile) {
            align-items: unset;
        }

        @include media.media-screen(phone) {
            .aurle-home-me {
                flex-direction: column;
                gap: 0.25rem;

                .aurle-home-me__nick {
                    justify-content: center;
                }
            }
        }
    }
</style>