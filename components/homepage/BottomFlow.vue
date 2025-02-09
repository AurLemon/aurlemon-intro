<template>
    <div class="aurle-home-flow">
        <div class="aurle-home-flow__title">
            <span>
                居然有人
            </span>
            <span class="emoji">😭</span>
            <span>
                来看我这
            </span>
        </div>
        <div class="aurle-home-flow__subtitle">爬虫都不稀罕我这的。</div>
    </div>
</template>

<script setup lang="ts">
</script>

<style scoped lang="scss">
    @use '~/assets/styles/media_screen.scss' as media;

    .aurle-home-flow {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;

        .aurle-home-flow__title {
            display: flex;
            align-items: center;
            font-size: 26px;
            font-weight: 600;
            text-shadow: 0 2px 4px var(--color-surface-0);

            span:first-of-type {
                mask-image: linear-gradient(90deg, #fff , transparent 125%);
            }

            span:last-of-type {
                mask-image: linear-gradient(-90deg, #fff, transparent 125%);
            }

            .emoji {
                display: inline-flex;
                justify-content: center;
                align-items: center;
                line-height: 1;
                width: 1.5rem;
                text-shadow: 0 0 16px var(--border-color-base--darker);
                transform: scale(1.4);
                position: relative;
                z-index: 5;
                user-select: none;
            }
        }

        .aurle-home-flow__subtitle {
            color: var(--color-text--subtle);
            font-size: 14px;
            margin-top: 0.125rem;
        }
    }
</style>