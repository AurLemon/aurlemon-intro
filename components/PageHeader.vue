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
                <NuxtLink to="/about">关于</NuxtLink>
            </div>
        </div>
    </header>
</template>

<style scoped lang="scss">
    .aurle-page-header {
        position: fixed;
        top: 12px;
        left: 18vw;

        .aurle-page-header-list {
            display: flex;
            gap: 0.5rem;

            .aurle-page-header-item {
                a {
                    display: block;
                    padding: 6px 16px;
                    border-radius: 8px;
                    color: var(--color-text--weaken);
                    font-size: 14px;
                    font-weight: 600;
                    transition: 150ms;

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
    }
</style>