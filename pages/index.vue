<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import dayjs from 'dayjs'

import { useFriendLinkStore } from '~/stores/friendLink'

import GitHubRepo from '~/components/homepage/GitHubRepo.vue';
import HomeTags from '~/components/homepage/HomeTags.vue';
import { birthdate, atbeeExamDate } from '../utils/time'
import SlideFlow from '~/components/homepage/SlideFlow.vue';

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

<template>
    <div class="aurle-home aurle-page">
        <div class="aurle-page-foreground">
            <div class="aurle-home-section basic-info">
                <div class="aurle-home-me">
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
                    <div class="aurle-home-me__avatar" v-tooltip="{ content: '喜欢我吗？' }">
                        <img src="../assets/images/AurLemon_Avatar.jpg" alt="">
                    </div>
                </div>
                <div class="aurle-home-greeting">
                    👏🥵 你好啊小朋友<br>
                    居然会有人来看我这破网站 /(ㄒoㄒ)/~~<br>
                    <s>（爬虫都不稀罕的）</s>
                </div>
                <div class="aurle-home-bottom">
                    <SlideFlow />
                    <div class="aurle-home-status">
                        <div class="aurle-home-status__item left"></div>
                        <div class="aurle-home-status__item center">主动思考 · 实践与总结 · 做一颗好的螺丝钉 · 保持谦逊 · 多玩抽象</div>
                        <div class="aurle-home-status__item right"></div>
                    </div>
                </div>
            </div>
            <div class="aurle-home-section user-tag">
                <div class="aurle-home-section">
                    <GitHubRepo />
                    <HomeTags />
                </div>
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

<style scoped lang="scss">
@use '~/assets/styles/media_screen.scss' as media;

.aurle-home {
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
            background: radial-gradient(circle at center, rgba(147, 199, 236, 0.5) 0%, transparent 65%);
            @include zoom-keyframes('zoom-top-left', 0.9, -15%, -15%);
        }

        .circle-top-right {
            margin-left: auto;
            background: radial-gradient(circle at center, rgba(178, 180, 255, 0.5) 0%, transparent 65%);
            @include zoom-keyframes('zoom-top-right', 1.25, 10%, -10%);
        }

        .circle-bottom-left {
            background: radial-gradient(circle at center, rgba(138, 235, 244, 0.5) 0%, transparent 65%);
            @include zoom-keyframes('zoom-bottom-left', 1.15, -10%, 15%);
        }

        .circle-bottom-right {
            margin-left: auto;
            background: radial-gradient(circle at center, rgba(215, 233, 149, 0.5) 0%, transparent 65%);
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
        width: 75vw;
        height: 100dvh;
        padding: 1.75rem;

        @include media.media-screen(mobile) {
            width: 100%;
        }
    }

    .aurle-home-me {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 4rem;
        width: 100%;
        max-width: media.$media-screen-value-phone;
        margin: auto;

        .aurle-home-me__avatar {
            border: 2px solid #B7D9EB;
            box-shadow: 0 0 32px rgba(190, 205, 212, 0.6);
            border-radius: 50%;
            overflow: hidden;
            user-select: none;

            img {
                $value-image-length: 12rem;
                display: block;
                width: $value-image-length;
                height: $value-image-length;
                transition: 750ms;
                transition-delay: 50ms;
            }
        }

        .aurle-home-me__name {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
            transition: 350ms;

            .aurle-home-me__info {
                display: flex;
                align-items: baseline;
                gap: 0.75rem;
                user-select: none;
            }

            .aurle-home-me__username {
                color: transparent;
                font-size: 80px;
                font-weight: 600;
                font-family: 'Caveat';
                line-height: 1;
                background: linear-gradient(60deg, var(--color-text) -15%, var(--color-primary) 225%);
                background-clip: text;
            }

            .aurle-home-me__nick {
                color: var(--color-text--subtle);
                display: flex;
                align-items: center;
                flex-wrap: wrap;
                gap: 0.375rem;

                .nick {
                    line-height: 1;
                }

                .simply-tag {
                    color: var(--color-text);
                    font-size: 12px;
                    padding: 2px 6px;
                    border-radius: 8px;
                    background: var(--background-color-primary--active);
                }
            }

            .aurle-home-me__id {
                color: var(--color-surface-4);
                font-size: 18px;
            }
        }
    }

    .aurle-home-greeting {
        color: var(--color-text--emphasized);
        text-align: center;
        position: relative;
        z-index: 5;
    }


    .aurle-home-bottom {
        margin-top: auto;
        perspective: 700px;
        position: relative;

        .aurle-home-status {
            display: flex;
            justify-content: center;
            align-items: center;
            color: var(--color-text--subtle);
            font-size: 14px;
            padding: 0.375rem 1rem;
            background: var(--background-light-4);
            border: 1px solid var(--border-color-base--darker);
            border-radius: 32px;
            backdrop-filter: blur(32px) saturate(1.5);
            position: relative;
            z-index: 5;
            overflow: hidden;
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