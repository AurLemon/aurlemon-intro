<template>
    <div class="aurle-friends aurle-page">
        <div class="aurle-page-title">朋友们</div>
        <div class="aurle-friends-list">
            <div class="aurle-friends-item" v-for="friend in utilsConfigData.friend_link">
                <a :href="friend.url" target="_blank" rel="noopener noreferrer">
                    <div class="aurle-friends-item__avatar">
                        <img :src="friend.icon" v-if="friend.icon">
                        <div class="material-icons" v-else>handshake</div>
                    </div>
                    <div class="aurle-friends-item__info">
                        <div class="aurle-friends-item__name">{{ friend.name }}</div>
                        <div class="aurle-friends-item__desc">{{ friend.desc }}</div>
                    </div>
                </a>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import utilsConfigData from "~/assets/utils/config.json"
import type Config from "~/assets/utils/config.d"

import { ref } from 'vue'

useHead({
    title: '朋友们 / AurLemon Intro',
    meta: [
        { name: 'description', content: '这是我的宝贝们。' }
    ]
})
</script>

<style scoped lang="scss">
    @use '~/assets/styles/media_screen.scss' as media;

    .aurle-friends {
        padding: 1.5rem;

        .aurle-page-title {
            margin: 3rem 0;
            font-size: 32px;
            font-weight: 600;
            text-align: center;
        }

        .aurle-friends-list {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 0.625rem;
            margin: 0 auto;
            width: fit-content;

            .aurle-friends-item {
                width: 100%;
                background: #fff;
                border-radius: 12px;
                box-shadow: 0 0 64px var(--border-color-base--darker);
                transition: 500ms;

                a {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    width: 100%;
                    height: 100%;
                    padding: 0.75rem;

                    .aurle-friends-item__avatar {
                        img, .material-icons {
                            color: var(--color-text--subtle);
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            font-size: 36px;
                            width: 36px;
                            height: 36px;
                            border-radius: 2px;
                        }
                    }

                    .aurle-friends-item__info {
                        .aurle-friends-item__name {
                            font-size: 18px;
                            font-weight: 600;
                        }

                        .aurle-friends-item__desc {
                            color: var(--color-text--subtle);
                            font-size: 12px;
                        }
                    }
                }

                &:hover {
                    transform: translateY(-3px);
                }
            }
            
            @include media.media-screen(phone) {
                grid-template-columns: repeat(1, 1fr);
            }
        }
    }
</style>