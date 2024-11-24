<script setup lang="ts">

</script>

<template>
    <header class="aurle-page-header">
        <div class="aurle-page-header-list">
            <div class="aurle-page-header-item">
                <NuxtLink to="/">初次见面</NuxtLink>
            </div>
            <div class="aurle-page-header-item">
                <NuxtLink to="/experience">认识下我</NuxtLink>
            </div>
            <div class="aurle-page-header-item">
                <NuxtLink to="/college">我的学业</NuxtLink>
            </div>
            <div class="aurle-page-header-item">
                <NuxtLink to="/profile">个人画像</NuxtLink>
            </div>
            <div class="aurle-page-header-item">
                <NuxtLink to="/about">关于本站</NuxtLink>
            </div>
        </div>
        <div class="aurle-page-header-mask"></div>
    </header>
</template>

<style scoped lang="scss">
    @use '~/assets/styles/media_screen.scss' as media;

    .aurle-page-header {
        position: fixed;
        top: 12px;
        left: 15vw;
        z-index: 99999;

        .aurle-page-header-mask {
            position: fixed;
            top: 0;
            right: 0;
            left: 0;
            bottom: 90%;
            mask-image: linear-gradient(180deg, var(--color-surface-0) 10%, transparent 95%);
            backdrop-filter: blur(24px) saturate(2);
            pointer-events: none;

            @include media.media-screen(mobile) {
                position: absolute;
                bottom: -220%;
            }

            &::before {
                content: '';
                position: absolute;
                top: 0;
                right: 0;
                left: 0;
                bottom: 0;
                background: var(--background-light-3);
            }
        }

        .aurle-page-header-list {
            display: flex;
            gap: 0.5rem;
            position: relative;
            z-index: 100000;

            .aurle-page-header-item {
                a {
                    display: block;
                    padding: 6px 16px;
                    border-radius: 8px;
                    color: var(--color-text--weaken);
                    font-size: 14px;
                    font-weight: 600;
                    transition: 150ms;

                    @include media.media-screen(mobile) {
                        padding: 6px;
                    }

                    &.router-link-active {
                        color: var(--color-text--emphasized);
                    }

                    &:hover {
                        background: var(--background-dark-0);
                    }

                    &:active {
                        transform: scale(0.95);
                        transition-duration: 80ms;
                    }
                }
            }
        }

        @include media.media-screen(mobile) {
            width: 100%;
            left: 0;
            right: 0;
            top: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 0.5rem;

            .aurle-page-header-list {
                gap: 0.125rem;
            }
        }
    }
</style>