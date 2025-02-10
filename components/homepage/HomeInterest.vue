<template>
    <div class="aurle-home-interest">
        <div class="aurle-home-item top-item top-item--image yorushika">
            <div class="aurle-home-item__show">
                <img src="~/assets/images/homepage/interest/Yorushika_Logo.png">
            </div>
            <div class="aurle-home-item__text">
                <div class="aurle-home-item__title">
                    你知道的，我一直是YORUSHIKA、ZUTTOMAYO、<s>YOASOBI</s>的粉丝。
                </div>
            </div>
        </div>
        <div class="aurle-home-item minecraft">
            <div class="aurle-home-item__show">
                <canvas ref="skinViewer"></canvas>
            </div>
            <div class="aurle-home-item__text">
                <div class="aurle-home-item__title">
                    我们 MC 真是太好玩了，另外我的正版 ID 叫 Aurora_Lemon 谢谢。
                </div>
            </div>
        </div>
        <div class="aurle-home-item top-item steam">
            <div class="aurle-home-item__show">
                <img src="~/assets/images/homepage/interest/Steam_Logo.png">
            </div>
            <div class="aurle-home-item__text">
                <div class="aurle-home-item__title">
                    Steam 进了别人的家庭买了一堆游戏，Epic 领了一堆，但我就是没劲玩。
                </div>
            </div>
        </div>
        <div class="aurle-home-item top-item stay-night">
            <div class="aurle-home-item__show">
                <img src="~/assets/images/homepage/interest/Clock.png">
            </div>
            <div class="aurle-home-item__text">
                <div class="aurle-home-item__title">
                    放假的时候不要在早上六点到下午两点之间找我，因为我在睡觉。
                </div>
            </div>
        </div>
        <div class="aurle-home-item top-item xiaomi">
            <div class="aurle-home-item__show">
                <XiaomiIcon />
            </div>
            <div class="aurle-home-item__text">
                <div class="aurle-home-item__title">
                    你知道的，我一直是米猴。即使小米的 BL 解锁和考公一样。
                </div>
            </div>
        </div>
        <div class="aurle-home-item top-item top-item--image gbc">
            <div class="aurle-home-item__show">
                <img src="~/assets/images/homepage/interest/GBC.png">
            </div>
            <div class="aurle-home-item__text">
                <div class="aurle-home-item__title">
                    我只能说不看gbc的人只能度过一个相对失败的人生，另外关注画师芸草冰老师谢谢。
                </div>
            </div>
        </div>
        <div class="aurle-home-item top-item top-item--image transport">
            <div class="aurle-home-item__show">
                <img src="~/assets/images/homepage/interest/Transport.png">
            </div>
            <div class="aurle-home-item__text">
                <div class="aurle-home-item__title">
                    搭乘扶梯，请握紧黑色扶手带，不踩踏黄线，身体不倚靠侧板，不低头使用……
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { SkinViewer } from 'skinview3d'

import XiaomiIcon from '~/assets/images/homepage/interest/Xiaomi_Logo.svg'

const SKIN_API = 'https://minotar.net/skin/'
const skinViewer = ref<HTMLCanvasElement>()

onMounted(() => {
    if (skinViewer.value) {
        const aurLemonSkin = new SkinViewer({
            canvas: skinViewer.value,
            skin: SKIN_API + 'Aurora_Lemon',
            width: 120,
            height: 180
        })

        aurLemonSkin.fov = 60
        aurLemonSkin.zoom = 1
        aurLemonSkin.autoRotate = true
    }
})
</script>

<style scoped lang="scss">
    @use '~/assets/styles/media_screen.scss' as media;
    
    .aurle-home-interest {
        display: grid;
        gap: 0.5rem;
        grid-template-columns: repeat(6, 1fr);

        .aurle-home-item {
            --text-background: #fff;
            --show-background: #fff;
            --font-color: #fff;
            display: flex;
            flex-direction: column;
            backdrop-filter: blur(32px) saturate(1.25);
            border: 1px solid var(--color-surface-3);
            border-radius: 8px;
            overflow: hidden;
            outline: 1.75px solid transparent;
            position: relative;
            height: 200px;
            transition: 250ms;

            .aurle-home-item__show {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 0;
                background: var(--show-background);
                filter: brightness(0.98);

                img, canvas {
                    display: block;
                    width: 100%;
                    object-fit: cover;
                }
            }

            &.top-item {
                background: var(--show-background);

                .aurle-home-item__show {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    padding: 0.75rem;
                    position: static;
                    height: 100%;
                    background: transparent;
                    flex: 1;
                    min-height: 0;

                    img, svg {
                        width: 72px;
                        height: 72px;
                        filter: drop-shadow(0 0 32px var(--background-dark-0));
                    }
                }

                &.top-item--image {
                    .aurle-home-item__show {
                        padding: 0;

                        img {
                            width: 100%;
                            height: 100%;
                            object-fit: cover;
                        }
                    }
                }
            }

            &.yorushika {
                --text-background: #f6f6f6;
                --font-color: var(--color-text);
            }

            &.minecraft {
                --text-background: linear-gradient(135deg, #E5C07A, #d8ad5c);
                --show-background: linear-gradient(135deg, #fffaf1, #f3e6d1);
                
                .aurle-home-item__show {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    padding: 0.75rem;

                    canvas {
                        transform: rotate(10deg);
                        pointer-events: none;
                    }
                }
            }

            &.steam {
                --text-background: linear-gradient(135deg, #84c0e8, #57a6db);
                --show-background: linear-gradient(135deg, #ecf7ff, #c1dbec);
            }

            &.stay-night {
                --text-background: linear-gradient(135deg, #dbde36, #bfbf08);
                --show-background: linear-gradient(135deg, #feffda, #f2f29a);
            }

            &.xiaomi {
                --text-background: linear-gradient(135deg, #f6a367, #e77e33);
                --show-background: linear-gradient(135deg, #fff7f2, #ffdec6);
            }

            &.gbc {
                --text-background: linear-gradient(135deg, #43658a, #2A496D);
            }

            &.transport {
                --text-background: linear-gradient(135deg, #E8BBA7, #dea287);
                --show-background: linear-gradient(135deg, #fff2e9, #ffe7d6);
            }

            .aurle-home-item__text {
                display: flex;
                position: relative;
                z-index: 1;
                color: var(--font-color);
                background: var(--text-background);
                padding: 0.5rem;
                margin-top: auto;
                word-break: break-all;
                box-shadow: 0 -8px 32px var(--background-dark-0);
                height: 80px;

                .aurle-home-item__title {
                    font-size: 12px;
                    font-weight: 500;                    
                }

                @include media.media-screen(mobile) {
                    height: 120px;
                }
            }
            
            &:hover {
                outline-color: var(--color-primary);
            }
            
            @include media.media-screen(mobile) {
                height: 230px;
            }
        }
        
        @include media.media-screen(pad) {
            grid-template-columns: repeat(5, 1fr);
        }

        @include media.media-screen(phone) {
            grid-template-columns: repeat(3, 1fr);
        }
    }
</style>