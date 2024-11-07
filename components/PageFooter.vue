<script setup lang="ts">
import dayjs from 'dayjs'
import { siteBuildTime } from '../utils/time'

const miitRegisterCode = ref<string>('闽ICP备2023007345号-3')
</script>

<template>
    <footer class="aurle-page-footer">
        <div class="aurle-page-footer__register">
            <a href="https://beian.miit.gov.cn/">
                {{ miitRegisterCode }}
            </a>
        </div>
        <div class="aurle-page-footer__list">
            <div class="aurle-page-footer__info aurle-page-footer__onlinetime">
                本站
                <span class="logo">
                    AurLemon Intro
                </span>
                已运行
                <span class="time">{{ dayjs().diff(dayjs(siteBuildTime), 'day') }}</span>
                天
            </div>
            <div class="aurle-page-footer__info aurle-page-footer__blog">
                又菜又爱写
            </div>
            <div class="aurle-page-footer__info aurle-page-footer__contact">
                欢迎技术或同好交流与扩列🤝❤
            </div>
        </div>
    </footer>
</template>

<style scoped lang="scss">
    .aurle-page-footer {
        display: flex;
        align-items: center;
        flex-direction: column;
        gap: 0.25rem;
        color: var(--color-surface-4);
        font-size: 12px;
        font-weight: 600;
        width: 75vw;
        margin: 0.5rem auto;

        .aurle-page-footer__register {
            a {
                color: var(--color-surface-4);

                &:hover {
                    color: hsla(var(--color-primary__h), var(--color-primary__s), var(--color-primary__l), 50%);
                }
            }
        }

        .aurle-page-footer__list {
            display: flex;
            justify-content: center;
            align-items: center;
            flex-wrap: wrap;

            .aurle-page-footer__info {
                display: flex;
                align-items: center;
                flex-wrap: wrap;

                &::after {
                    content: '·';
                    margin: 0 0.25rem;
                }

                &:last-of-type::after {
                    content: none;
                }

                .logo {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.25rem;
                    color: var(--color-text--weaken);
                    font-size: 14px;
                    font-weight: bold;
                    font-family: 'Caveat';
                    line-height: 1;
                    margin: 0 0.25rem;
                }

                .time {
                    margin: 0 0.25rem;
                }
            }
        }
    }
</style>