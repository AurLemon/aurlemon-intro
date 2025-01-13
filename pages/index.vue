<script setup lang="ts">
import { ref } from 'vue'
import dayjs from 'dayjs'

import { useFriendLinkStore } from '~/stores/friendLink'

import GitHubRepo from '~/components/homepage/GitHubRepo.vue';
import HomeTags from '~/components/homepage/HomeTags.vue';
import { birthdate, atbeeExamDate } from '../utils/time'

const friendLinkStore = useFriendLinkStore()
friendLinkStore.getSettingData()

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
                    居然会有人来看我 /(ㄒoㄒ)/~~
                </div>
                <div class="aurle-home-saying"></div>
            </div>
            <div class="aurle-home-section user-tag">
                <div class="aurle-home-section">
                    <GitHubRepo />
                    <HomeTags />
                </div>
            </div>
        </div>
        <div class="aurle-page-background">
            <div class="circle circle-top-left"></div>
            <div class="circle circle-top-right"></div>
            <div class="circle circle-bottom-left"></div>
            <div class="circle circle-bottom-right"></div>
        </div>
    </div>
</template>

<style scoped lang="scss">
@use '~/assets/styles/media_screen.scss' as media;

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
    filter: blur(64px) opacity(0.2);

    .circle {
        position: relative;
        border-radius: 50%;
        width: 30vw;
        height: 30vw;
    }

    .circle-top-left {
        transform: scale(0.8) translate(-60px, -80px);
        background: hsl(205, 70, 75);
    }

    .circle-top-right {
        margin-left: auto;
        transform: translate(50px, 20px);
        background: hsl(239, 72, 75);
    }

    .circle-bottom-left {
        transform: scale(1.2) translate(-40px, 80px);
        background: hsl(185, 83, 75);
    }

    .circle-bottom-right {
        margin-left: auto;
        transform: scale(0.82) translate(50px, 100px);
        background: hsl(73, 66, 75);
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

.aurle-home {
    .aurle-home-section {
        display: flex;
        flex-direction: column;
        height: 100dvh;
        padding: 1.75rem;
    }

    .aurle-home-me {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 5rem;
        margin: auto;

        .aurle-home-me__avatar {
            border: 2px solid #B7D9EB;
            box-shadow: 0 0 32px rgba(190, 205, 212, 0.6);
            border-radius: 50%;
            overflow: hidden;
            user-select: none;

            img {
                $value-image-length: 10rem;
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
                font-size: 72px;
                font-weight: 600;
                font-family: 'Caveat';
                line-height: 1;
                background: linear-gradient(60deg, var(--color-text) -15%, var(--color-primary) 225%);
                background-clip: text;
            }

            .aurle-home-me__nick {
                color: var(--color-text--subtle);
                font-size: 16px;
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

            &:hover {
                text-shadow: 0 0 64px var(--color-primary);
            }
        }
    }

    .aurle-home-greeting {
        text-align: center;
    }

    .aurle-home-section {
        display: flex;
        align-items: center;
        flex-direction: column;
        gap: 1.75rem;
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