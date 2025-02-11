<template>
    <div class="aurle-home-intro">
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
                <div class="aurle-home-me__button">
                    <div class="aurle-home-me__contact">
                        <div class="aurle-home-me__item">
                            <a href="https://github.com/AurLemon" target="_blank" rel="noopener noreferrer">
                                <GitHubIcon />
                            </a>
                        </div>
                        <div class="aurle-home-me__item">
                            <a href="https://space.bilibili.com/204271518" target="_blank" rel="noopener noreferrer">
                                <BilibiliIcon />
                            </a>
                        </div>
                        <div class="aurle-home-me__item">
                            <a href="https://music.163.com/#/user/home?id=418382005" target="_blank"
                                rel="noopener noreferrer">
                                <NCMIcon />
                            </a>
                        </div>
                        <div class="aurle-home-me__item">
                            <a href="https://afdian.com/a/HydCraft" target="_blank" rel="noopener noreferrer">
                                <img src="../../assets/images/homepage/icons/Afdian.png" />
                            </a>
                        </div>
                        <div class="aurle-home-me__item">
                            <a href="mailto:2115386831@qq.com" target="_blank" rel="noopener noreferrer">
                                <MailIcon />
                            </a>
                        </div>
                    </div>
                    <div class="aurle-home-me__data">
                        <div class="aurle-home-me__item love">
                            <div class="aurle-home-me__icon">
                                <LoveIcon />
                            </div>
                            <div class="aurle-home-me__text" @click="addLike">
                                喜欢本站
                                <span class="count">{{ likeCount }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="aurle-home-me__avatar" v-tooltip="{ content: '喜欢我吗？' }">
                <img src="~/assets/images/AurLemon_Avatar.jpg" />
            </div>
        </div>
        <div class="aurle-home-quote">
            <div class="aurle-home-quote__text">主动思考 · 实践与总结 · 做一颗好的螺丝钉 · 保持谦逊 · 多玩抽象</div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import FingerprintJS from '@fingerprintjs/fingerprintjs'

import dayjs from 'dayjs'
import { birthdate, atbeeExamDate } from '../../utils/time'
import { useHomeCard } from '~/stores/homeCard'

import GitHubIcon from '~/assets/images/homepage/icons/GitHub.svg'
import MailIcon from '~/assets/images/homepage/icons/Mail.svg'
import BilibiliIcon from '~/assets/images/homepage/icons/bilibili.svg'
import NCMIcon from '~/assets/images/homepage/icons/NCMusic.svg'
import LoveIcon from '~/assets/images/homepage/icons/Love.svg'

const homeCardStore = useHomeCard()

const likeCount = ref<number>(0)
const isLiking = ref<boolean>(false)

const initFingerprint = async (): Promise<string> => {
    const fp = await FingerprintJS.load()
    const result = await fp.get()
    return result.visitorId
}

const fetchLikeCount = async (): Promise<void> => {
    try {
        const response = await fetch('/api/like')
        const data = await response.json()
        likeCount.value = data.like_count
    } catch (error) {
        console.error('Error fetching like count:', error)
    }
}

const addLike = async (): Promise<void> => {
    if (isLiking.value) {
        return
    }

    isLiking.value = true
    try {
        const fingerprint = await initFingerprint()
        
        const response = await fetch('/api/like', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ fingerprint })
        })

        if (response.ok) {
            const data = await response.json()
            console.log('Like added:', data)

            if (data.status) {
                likeCount.value += 1
            }
        }
    } catch (error) {
        console.error('Error adding like:', error)
    } finally {
        isLiking.value = false
    }
}

onMounted(() => {
    fetchLikeCount()
})
</script>

<style scoped lang="scss">
    @use '~/assets/styles/media_screen.scss' as media;

    .aurle-home-intro {
        display: flex;
        justify-content: center;
        flex-direction: column;
        gap: 6.25rem;
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        width: 100%;
        margin: auto;
        max-width: media.$media-screen-value-phone;
        transition: 400ms;

        .aurle-home-me {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 4rem;

            .aurle-home-me__avatar {
                border: 2px solid #B7D9EB;
                box-shadow: 0 0 32px rgba(190, 205, 212, 0.9);
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

                    @include media.media-screen(phone) {
                        $value-image-length: 8rem;
                        width: $value-image-length;
                        height: $value-image-length;
                    }
                }
            }

            .aurle-home-me__name {
                display: flex;
                flex-direction: column;
                transition: 350ms;

                .aurle-home-me__info {
                    display: flex;
                    align-items: baseline;
                    gap: 0.75rem;
                    user-select: none;
                    
                    @include media.media-screen(phone) {
                        align-items: center;
                        flex-direction: column;
                        gap: 0;
                        margin-bottom: 0.75rem;
                    }
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

                    @include media.media-screen(phone) {
                        justify-content: center;
                    }
                }

                .aurle-home-me__id {
                    color: var(--color-surface-4);
                    font-size: 18px;
                }
            }

            .aurle-home-me__button {
                display: flex;
                align-items: center;
                gap: 1rem;
                margin-top: 1.25rem;

                .aurle-home-me__item {
                    cursor: pointer;
                    user-select: none;
                    transition: 350ms;

                    a {
                        display: block;
                        padding: 0.375rem;
                        background: #fff;
                        border-radius: 50%;
                        box-shadow: 0 0 32px rgba(181, 194, 199, 0.2);
                        transition: 350ms;
                    }

                    svg, img {
                        $image-length: 18px;
                        display: block;
                        width: $image-length;
                        height: $image-length;
                        margin: 0;
                        object-fit: contain;
                        transition: 350ms;

                        * {
                            transition: 350ms;
                        }
                    }

                    &:active {
                        transform: scale(0.92);
                    }
                }

                .aurle-home-me__contact {
                    .aurle-home-me__item:hover {
                        a {
                            background: var(--color-primary);
                        }

                        svg * {
                            fill: #fff;
                        }

                        img {
                            filter: brightness(100);
                        }
                    }

                    &, .aurle-home-me__data {
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                    }
                }

                .aurle-home-me__data {
                    .aurle-home-me__item {
                        display: flex;
                        align-items: center;
                        padding: 0.375rem;
                        background: #fff;
                        border-radius: 0.875rem;
                        box-shadow: 0 0 32px rgba(181, 194, 199, 0.2);

                        &.love {
                            background: #F87171;
                        }

                        .aurle-home-me__text {
                            color: #fff;
                            font-size: 0.8125rem;
                            font-weight: 600;
                            margin: 0 0.375rem;
                            transition: 350ms;
                        }

                        .aurle-home-me__icon {
                            svg, img {
                                color: #fff;
                            }
                        }

                        &:hover {
                            transform: scale(1.02);
                            filter: brightness(1.1);
                        }

                        &:active {
                            transform: scale(0.94);
                        }
                    }
                }
            }

            @include media.media-screen(phone) {
                flex-direction: column-reverse;
                gap: 1rem;
            }
        }

        .aurle-home-quote {
            display: flex;
            justify-content: center;
            align-items: center;
            color: var(--color-text--subtle);
            font-size: 14px;
            width: 100%;
            position: relative;
            z-index: 5;
            overflow: hidden;

            &::before, &::after {
                color: var(--color-surface-4);
                margin: 0 0.75rem;
                line-height: 1;
            }

            &::before {
                content: '<';
            }

            &::after {
                content: '>';
            }
            
            @include media.media-screen(phone) {
                align-items: center;
                flex-direction: column;

                .aurle-home-quote__text {
                    text-align: center;
                }

                &::before, &::after {
                    transform: rotate(90deg);
                    margin: 0.75rem;
                }
            }
        }
        
        @include media.media-screen(phone) {
            gap: 3rem;
        }
    }
</style>