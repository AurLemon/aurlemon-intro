<template>
    <div class="aurle-home-flow">
        <div class="aurle-flow-card basic" :class="{ active: homeCardStore.basicCard }" @click="homeCardStore.handleCard('basic')">
            <div class="aurle-flow-card__background">
                <div class="content">😭</div>
            </div>
            <div class="aurle-flow-card__foreground">
                居然有人来，<br>
                我这连爬虫都不稀罕。
            </div>
        </div>
        <div class="aurle-flow-card ability" :class="{ active: homeCardStore.abilityCard }" @click="homeCardStore.handleCard('ability')">
            <div class="aurle-flow-card__background">
                <div class="image">
                    <img src="~/assets/images/badge/FJCCC_Logo.png">
                </div>
            </div>
            <div class="aurle-flow-card__foreground">
                怎么回事啊，<br>
                有人在大专学计算机？
            </div>
        </div>
        <div class="aurle-flow-card interest" :class="{ active: homeCardStore.interestCard }" @click="homeCardStore.handleCard('interest')">
            <div class="aurle-flow-card__background">
                <div class="canvas">
                    <canvas ref="skinViewer"></canvas>
                </div>
            </div>
            <div class="aurle-flow-card__foreground">
                叔叔我啊，<br>
                其实早就电子阳痿了。
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { SkinViewer } from 'skinview3d'

import { useHomeCard } from '~/stores/homeCard'

const SKIN_API = 'https://minotar.net/skin/'
const skinViewer = ref<HTMLCanvasElement>()

const homeCardStore = useHomeCard()

onMounted(() => {
    if (skinViewer.value) {
        const aurLemonSkin = new SkinViewer({
            canvas: skinViewer.value,
            skin: SKIN_API + 'Aurora_Lemon',
            width: 70,
            height: 90
        })

        aurLemonSkin.fov = 60
        aurLemonSkin.zoom = 1
        aurLemonSkin.autoRotate = true
    }
})
</script>

<style scoped lang="scss">
    @use '~/assets/styles/media_screen.scss' as media;

    .aurle-home-flow {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 1rem;

        .aurle-flow-card {
            $card-transition-duration: 400ms;
            width: 180px;
            position: relative;
            transition: $card-transition-duration;
            cursor: pointer;

            .aurle-flow-card__background {
                position: absolute;
                top: -100%;
                left: 0;
                right: 0;
                bottom: 0.75rem;
                z-index: 0;
                display: flex;
                flex-direction: column;
                justify-content: center;

                .content {
                    font-size: 54px;
                    text-align: center;
                    transition: $card-transition-duration;
                }
                
                .image {
                    display: flex;
                    justify-content: center;
                    margin-right: 0.125rem;
                    
                    img {
                        display: block;
                        width: 56px;
                        height: 56px;
                        border-radius: 50%;
                        transition: $card-transition-duration;
                    }
                }
                
                .canvas {
                    display: flex;
                    justify-content: center;
                    
                    canvas {
                        object-position: top;
                        transition: $card-transition-duration;
                        pointer-events: none;
                    }
                }
            }

            .aurle-flow-card__foreground {
                position: relative;
                z-index: 1;
                font-size: 14px;
                text-align: center;
                padding: 0.5rem 0.75rem;
                background: var(--background-light-4);
                backdrop-filter: blur(32px);
                border-radius: 16px;
                box-shadow: 0 24px 96px var(--border-color-base--darker);
                transition: $card-transition-duration;
                user-select: none;
            }

            &.interest {
                .aurle-flow-card__background {
                    top: -50%;
                }
            }

            &:hover {
                transform: translateY(-3px) scale(1.02);

                .aurle-flow-card__background {
                    .content {
                        filter: drop-shadow(0 2px 48px #F9AD2E);
                        transform: scale(1.2);
                    }

                    .image img {
                        filter: drop-shadow(0 2px 48px #4fa4ff);
                        transform: scale(1.2);
                    }

                    .canvas canvas {
                        filter: drop-shadow(0 2px 48px #F9AD2E);
                        transform: rotate(10deg) scale(1.2);
                    }
                }
            }

            &::after {
                content: '';
                display: block;
                width: 40%;
                height: 3px;
                background: var(--color-primary);
                border-radius: 32px;
                position: absolute;
                top: calc(100% + 4px);
                left: 50%;
                opacity: 0;
                transform: translateX(-50%) translateY(5px);
                transition: $card-transition-duration;
            }

            &.active {
                transform: translateY(-5px) scale(1.03);

                &::after {
                    transform: translateX(-50%) translateY(0);
                    opacity: 1;
                }
                
                .aurle-flow-card__background {
                    .content {
                        transform: scale(1.25);
                    }

                    .image img {
                        transform: scale(1.25);
                    }

                    .canvas canvas {
                        transform: rotate(10deg) scale(1.25);
                    }
                }

                .aurle-flow-card__foreground {
                    box-shadow: 0 0 96px var(--border-color-base--darker);
                }

                &:hover {
                    .aurle-flow-card__background {
                        .content {
                            transform: scale(1.3);
                        }

                        .image img {
                            transform: scale(1.3);
                        }

                        .canvas canvas {
                            transform: rotate(10deg) scale(1.3);
                        }
                    }
                }
            }
        }
    }
</style>