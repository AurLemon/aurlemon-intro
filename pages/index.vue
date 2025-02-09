<template>
    <div class="aurle-home aurle-page">
        <div class="aurle-page-foreground">
            <div class="aurle-home-section basic-info">
                <BasicIntro />
                <BottomFlow />
            </div>
        </div>
        <div class="aurle-page-background" :style="{ opacity: 1 - scrollProgress / 100 }">
            <div class="circle circle-top-left" :style="{ transform: `translateY(-${ backgroundOffsetValue }px)` }"></div>
            <div class="circle circle-top-right" :style="{ transform: `translateY(-${ backgroundOffsetValue }px)` }"></div>
            <div class="circle circle-bottom-left" :style="{ transform: `translateY(-${ backgroundOffsetValue }px)` }"></div>
            <div class="circle circle-bottom-right" :style="{ transform: `translateY(-${ backgroundOffsetValue }px)` }"></div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'

import { useFriendLinkStore } from '~/stores/friendLink'

import BasicIntro from '~/components/homepage/BasicIntro.vue'
import BottomFlow from '~/components/homepage/BottomFlow.vue'
import HomeOverview from '~/components/homepage/HomeOverview.vue'
import HomeAbility from '~/components/homepage/HomeAbility.vue'

const friendLinkStore = useFriendLinkStore()
friendLinkStore.getSettingData()

const scrollProgress = ref(0)

const updateScrollProgress = () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop
    const docHeight = document.documentElement.scrollHeight
    const winHeight = window.innerHeight

    const progress = (scrollTop / (docHeight - winHeight)) * 100;
    scrollProgress.value = Math.min(Math.max(progress, 0), 100);    
}

const backgroundOffsetValue = ref(0)
const backgroundAnimation = () => {
    const footer = document.querySelector('footer.aurle-page-footer') as HTMLElement
    const footerHeight = footer.offsetHeight || 160
    backgroundOffsetValue.value = footerHeight * scrollProgress.value / 100
}

watch(scrollProgress, backgroundAnimation)

onMounted(() => {
    window.addEventListener('scroll', updateScrollProgress)
})

onUnmounted(() => {
    window.removeEventListener('scroll', updateScrollProgress)
})

useHead({
    meta: [
        { name: 'description', content: 'AurLemon 的介绍网站！' }
    ]
})
</script>

<style scoped lang="scss">
    @use '~/assets/styles/media_screen.scss' as media;

    .aurle-home {
        margin-top: 0;

        .aurle-page-background {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: -1;
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            grid-template-rows: repeat(2, 1fr);

            .circle {
                position: relative;
                border-radius: 50%;
                width: 100%;
                height: 100%;
                max-width: 800px;
                max-height: 800px;
                transition: 350ms ease-in-out;
                filter: blur(72px) saturate(1.25) opacity(0.5);
            }

            @mixin zoom-keyframes($name, $scale, $offsetX, $offsetY) {
                animation: #{$name} 4s infinite ease-in-out;

                @keyframes #{$name} {
                    from, to {
                        transform: translate(#{$offsetX}, #{$offsetY}) scale(#{$scale});
                    }

                    50% {
                        transform: translate(#{$offsetX}, #{$offsetY}) scale(#{$scale * 1.2});
                    }
                }
            }

            .circle-top-left {
                background: radial-gradient(circle at center, rgba(147, 199, 236, 0.35) 0%, transparent 65%);
                @include zoom-keyframes('zoom-top-left', 1, -25%, -15%);
            }

            .circle-top-right {
                margin-left: auto;
                background: radial-gradient(circle at center, rgba(178, 180, 255, 0.35) 0%, transparent 65%);
                @include zoom-keyframes('zoom-top-right', 1.25, 10%, -10%);
            }

            .circle-bottom-left {
                background: radial-gradient(circle at center, rgba(138, 235, 244, 0.35) 0%, transparent 65%);
                @include zoom-keyframes('zoom-bottom-left', 1.5, -30%, 25%);
            }

            .circle-bottom-right {
                margin-left: auto;
                background: radial-gradient(circle at center, rgba(215, 233, 149, 0.35) 0%, transparent 65%);
                @include zoom-keyframes('zoom-bottom-right', 1, 25%, 45%);
            }
        }

        .aurle-page-foreground {
            display: flex;
            justify-content: flex-end;
            align-items: center;
            flex-direction: column;
            position: relative;
            z-index: 1;
        }

        .aurle-home-section {
            display: flex;
            justify-content: center;
            flex-direction: column;
            gap: 1.5rem;
            width: 100%;
            height: 100dvh;
            padding: 1.75rem;

            &:first-of-type {
                padding-top: 4rem + 0.75rem;
            }

            .aurle-home-section__title {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                color: var(--color-text--subtle);
                font-size: 20px;
                margin: 0 0.25rem;
                margin-bottom: 0.5rem;
                transition: 300ms;
            }

            &.user-tag {
                height: 100%;
                min-height: 90dvh;
                border-top: 1px solid var(--border-color-base);

                .aurle-home-wrapper {
                    display: flex;
                    flex-direction: column;
                    gap: inherit;

                    .col-span-2 {
                        grid-column: span 2;
                    }
                }
            }

            @include media.media-screen(mobile) {
                width: 100%;
            }
        }
    }
</style>