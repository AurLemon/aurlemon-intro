<script setup lang="ts">
import dayjs from 'dayjs'

const miitRegisterCode = ref<string>('闽ICP备2023007345号-3')
</script>

<template>
    <footer class="aurle-page-footer">
        <div class="aurle-page-footer__logo">
            AurLemon Intro
        </div>
        <div class="aurle-page-footer__list">
            <div class="aurle-page-footer__info aurle-page-footer__register">{{ miitRegisterCode }}</div>
            <div class="aurle-page-footer__info aurle-page-footer__blog">我的博客</div>
            <div class="aurle-page-footer__info aurle-page-footer__contact">联系站长</div>
            <div class="aurle-page-footer__info aurle-page-footer__contact">项目地址</div>
        </div>
    </footer>
</template>

<style scoped lang="scss">
    .aurle-page-footer {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 2.25rem;
        color: var(--color-surface-4);
        font-size: 12px;
        width: 75vw;
        margin: 0.5rem auto;
        
        .aurle-page-footer__logo {
            display: flex;
            align-items: center;
            gap: 0.25rem;
            color: var(--color-text--subtle);
            font-size: 18px;
            font-weight: 600;
            font-family: 'Caveat';
            line-height: 1;

            &::before {
                $value-before-length: 8px;
                content: '';
                display: block;
                width: $value-before-length;
                height: $value-before-length;
                border-radius: 50%;
                background: var(--color-primary);
            }
        }

        .aurle-page-footer__list {
            display: flex;
            align-items: center;
            gap: 1rem;
        }
    }
</style>