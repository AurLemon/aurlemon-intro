<template>
    <footer class="aurle-page-footer">
        <div class="aurle-page-footer__wrapper">
            <div class="aurle-page-footer__link">
                <div class="aurle-page-footer__menu">
                    <div class="aurle-page-footer__title">周边网站</div>
                    <div class="aurle-page-footer__item">
                        <div class="aurle-page-footer__target">
                            <a href="https://cnblogs.com/AurLemon" target="_blank" rel="noopener noreferrer">博客</a>
                        </div>
                        <div class="aurle-page-footer__target">
                            <a href="https://github.com/AurLemon" target="_blank" rel="noopener noreferrer">GitHub</a>
                        </div>
                        <div class="aurle-page-footer__target">
                            <a href="https://plan.aurlemon.top" target="_blank" rel="noopener noreferrer">计划表</a>
                        </div>
                        <div class="aurle-page-footer__target">
                            <a href="https://wiki.aurlemon.top" target="_blank" rel="noopener noreferrer">知识库</a>
                        </div>
                    </div>
                </div>
                <div class="aurle-page-footer__menu">
                    <div class="aurle-page-footer__title">建设</div>
                    <div class="aurle-page-footer__item">
                        <div class="aurle-page-footer__target">
                            <a href="/friends" target="_blank" rel="noopener noreferrer">友链</a>
                        </div>
                        <div class="aurle-page-footer__target">
                            <a href="/about" target="_blank" rel="noopener noreferrer">关于本站</a>
                        </div>
                    </div>
                </div>
                <div class="aurle-page-footer__menu">
                    <div class="aurle-page-footer__title">相关业务</div>
                    <div class="aurle-page-footer__item">
                        <div class="aurle-page-footer__target">
                            <a href="https://wiki.hydcraft.cn" target="_blank" rel="noopener noreferrer">氢气工艺维基站</a>
                        </div>
                    </div>
                </div>
            </div>
            <div class="aurle-page-footer__info">
                <div class="aurle-page-footer__register">
                    <a href="https://beian.miit.gov.cn">
                        {{ miitRegisterCode }}
                    </a>
                </div>
                <div class="aurle-page-footer__list">
                    <div class="aurle-page-footer__info aurle-page-footer__copyright">
                        © AurLemon 2006 - 2025 All Rights Reserved
                    </div>
                    <div class="aurle-page-footer__info aurle-page-footer__license">
                        CC BY-NC-SA 4.0
                    </div>
                    <div class="aurle-page-footer__info aurle-page-footer__onlinetime">
                        已运行<span class="time">{{ dayjs().diff(dayjs(siteBuildTime), 'day') }}</span>天
                    </div>
                    <div class="aurle-page-footer__info aurle-page-footer__contact">
                        欢迎同好来交流和扩列🤝👍
                    </div>
                </div>
            </div>
        </div>
    </footer>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import { siteBuildTime } from '../utils/time'

const miitRegisterCode = ref<string>('闽ICP备2023007345号-3')
</script>

<style scoped lang="scss">
    @use '~/assets/styles/media_screen.scss' as media;

    .aurle-page-footer {
        background: var(--color-surface-0);
        border-top: 1px solid var(--border-color-base);
        box-shadow: 0 -96px 128px rgba(255, 255, 255, 0.6);

        .aurle-page-footer__wrapper {
            display: flex;
            flex-direction: column;
            gap: 3.25rem;
            color: var(--color-surface-4);
            font-size: 12px;
            font-weight: 400;
            padding: 1.75rem 2.25rem;
            margin: auto;
            max-width: 90vw;

            @include media.media-screen(mobile) {
                padding: 1.25rem 2rem;
                max-width: 100%;
            }
        }

        .aurle-page-footer__link {
            display: flex;
            gap: 2.25rem;
            flex-wrap: wrap;
            color: var(--color-text--subtle);
            font-size: 16px;

            .aurle-page-footer__menu {
                display: flex;
                row-gap: 0.125rem;
                column-gap: 1rem;
                flex-wrap: wrap;

                .aurle-page-footer__title {
                    display: flex;
                    align-items: center;
                    row-gap: 0.125rem;
                    column-gap: 0.25rem;
                    color: var(--color-surface-4);

                    &::after {
                        content: '>';
                        line-height: 1;
                    }
                }

                .aurle-page-footer__item {
                    display: flex;
                    row-gap: 0.125rem;
                    column-gap: 0.5rem;
                    flex-wrap: wrap;
                    font-weight: 500;

                    .aurle-page-footer__target {
                        a {
                            color: var(--color-text--subtle);

                            &:hover {
                                text-decoration: underline;
                            }
                        }
                    }
                }
            }
        }

        .aurle-page-footer__info {
            .aurle-page-footer__register {
                a {
                    color: var(--color-surface-4);

                    &:hover {
                        text-decoration: underline;
                    }
                }
            }

            .aurle-page-footer__list {
                display: flex;
                align-items: center;
                flex-wrap: wrap;

                .aurle-page-footer__info {
                    display: flex;
                    align-items: center;
                    flex-wrap: wrap;

                    &::after {
                        content: '·';
                        color: var(--color-surface-3);
                        margin: 0 0.25rem;
                    }

                    &:last-of-type::after {
                        content: none;
                    }

                    .time {
                        margin: 0 0.25rem;
                    }
                }
            }
        }
    }
</style>