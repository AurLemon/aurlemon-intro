<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { SkinViewer } from 'skinview3d'

const SKIN_API = 'https://minotar.net/skin/'

const skinCanvas = ref<HTMLCanvasElement>()

onMounted(() => {
    if (skinCanvas.value) {
        const aurLemonSkin = new SkinViewer({
            canvas: skinCanvas.value,
            skin: SKIN_API + 'Aurora_Lemon',
            width: 100,
            height: 100
        })

        aurLemonSkin.fov = 60
        aurLemonSkin.zoom = 1
        aurLemonSkin.autoRotate = true
    }
})
</script>

<template>
    <div class="aurle-home-tags">
        <div class="aurle-home-tag small computer-science">
            <div class="aurle-home-tag__background">
                <div class="aurle-home-tag__icons">
                    <fa class="aurle-home-tag__icon" :icon="['fas', 'code']" />                            
                </div>
            </div>
            <div class="aurle-home-tag__foreground">
                <div class="aurle-home-tag__title">
                    计算机<br>
                    <span class="emphasized">科学与技术</span>
                </div>
            </div>
        </div>
        <div class="aurle-home-tag small web-fullstack">
            <div class="aurle-home-tag__background">
                <div class="aurle-home-tag__icons">
                    <fa class="aurle-home-tag__icon" :icon="['fab', 'node']" />                            
                    <fa class="aurle-home-tag__icon" :icon="['fab', 'vuejs']" />                            
                </div>
            </div>
            <div class="aurle-home-tag__foreground">
                <div class="aurle-home-tag__title">
                    Web<br>
                    <span class="emphasized">全栈开发</span>
                </div>
            </div>
        </div>
        <div class="aurle-home-tag small small-long embedded-development">
            <div class="aurle-home-tag__background">
                <div class="aurle-home-tag__icons">                         
                    <fa class="aurle-home-tag__icon" :icon="['fas', 'microchip']" />                            
                </div>
            </div>
            <div class="aurle-home-tag__foreground">
                <div class="aurle-home-tag__title">
                    硬件与<br>
                    <span class="emphasized">嵌入式</span>
                </div>
            </div>
        </div>
        <div class="aurle-home-tag project-show">
            <div class="aurle-home-tag__list">
                <div class="aurle-home-tag__item"></div>
                <div class="aurle-home-tag__item"></div>
                <div class="aurle-home-tag__item"></div>
            </div>
            <div class="aurle-home-tag__title">
                我の<br>
                <span class="emphasized">个人项目</span>
            </div>
        </div>
        <div class="aurle-home-tag long-stick my-blog">
            <a href="https://cnblogs.com/AurLemon" target="_blank">
                <span class="material-icons">call_missed_outgoing</span>
                可以顺带来我博客看看🤤
            </a>
        </div>
        <div class="aurle-home-tag follow-me">建议关注我🤤🤤</div>
        <div class="aurle-home-tag minecraft">
            <div class="aurle-home-tag__title">
                Build & BedWars<br>
                <span class="emphasized">Minecraft</span>
            </div>
            <div class="aurle-home-tag__axe">
                <img src="~/assets/images/icons/Wooden_Axe.png" alt="">
            </div>
        </div>
        <div class="aurle-home-tag long skin-show">
            <div class="aurle-home-tag__background">
                <canvas ref="skinCanvas"></canvas>
            </div>
            <div class="aurle-home-tag__foreground">
                <div class="aurle-home-tag__nick">柠檬</div>
                <div class="aurle-home-tag__id">Aurora_Lemon</div>
            </div>
        </div>
        <div class="aurle-home-tag college">
            <div class="aurle-home-tag__badge"></div>
            <div class="aurle-home-tag__info">

            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
    .aurle-home-tags {
        display: grid;
        grid-template-rows: repeat(4, auto);
        grid-auto-flow: column;
        grid-gap: 0.5rem;
        font-size: 14px;

        .aurle-home-tag {
            grid-row: span 2;
            font-size: 12px;
            border: 1px solid var(--border-color-base);
            outline: 2px solid transparent;
            border-radius: 12px;
            background: #fff;
            box-shadow: 0 0 128px var(--border-color-base);
            position: relative;
            overflow: hidden;
            transition: 350ms;

            .aurle-home-tag__background {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 0;
            }

            .aurle-home-tag__foreground {
                display: flex;
                flex-direction: column;
                height: 100%;
                padding: 0.75rem 0.5rem;
                position: relative;
                z-index: 1;
            }

            .aurle-home-tag__title {
                color: var(--color-text--subtle);
                text-align: left;
                width: 100%;
                margin-top: auto;

                .emphasized {
                    color: var(--color-text);
                    font-size: 18px;
                    font-weight: 600;
                }
            }

            &.small {
                min-height: 80px;

                .aurle-home-tag__background {
                    display: flex;
                    justify-content: flex-end;
                    
                    .aurle-home-tag__icons {
                        display: flex;
                        gap: 0.125rem;
                        color: var(--background-color-primary--active);
                        width: fit-content;
                        height: fit-content;
                        filter: drop-shadow(0px 2px 24px rgba(11, 189, 159, 0.145));
                        transform: perspective(40px) rotateX(25deg) rotateY(-20deg) translate(-5%, 35%) scale(1.25);
                        transition: 350ms;

                        svg {
                            display: block;
                            height: 24px;
                        }
                    }
                }

                &.small-long {
                    height: unset;
                    grid-row: span 4;

                    .aurle-home-tag__icons {
                        transform: perspective(50px) rotateX(25deg) rotateY(-20deg) translate(-45%, 45%) scale(1.75) !important;
                    }
                }
            }

            &.long-stick {
                grid-column: span 3;
                grid-row: span 1;
                border-color: var(--background-color-primary--active);
                outline: none;

                a {
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                    color: var(--color-text--subtle);
                    height: 100%;
                    padding: 0.125rem 1rem;
                    background: var(--background-color-primary--hover);
                    transition: 350ms;

                    .material-icons {
                        font-size: 16px;
                    }

                    &:hover {
                        background: var(--background-color-primary--active);
                    }
                }
            }

            &.project-show {
                grid-column: span 4;
                grid-row: span 3;
            }

            &.follow-me {
                grid-column: span 1;
                grid-row: 4;
                display: flex;
                align-items: center;
                gap: 0.25rem;
                color: var(--color-surface-0);
                height: 100%;
                border: 1px solid var(--background-color-overlay);
                padding: 0.125rem 1rem;
                background: var(--color-primary);
                transition: 350ms;
            }

            &.college {
                grid-column: span 3;
                grid-row: span 3;
            }

            &.minecraft {
                grid-column: span 2;
                grid-row: span 1;
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 0.25rem;
                padding: 0.75rem 0.5rem;

                .aurle-home-tag__axe {
                    img {
                        display: block;
                        width: 2rem;
                        height: 2rem;
                    }
                }

                .aurle-home-tag__title {
                    margin-top: 0;
                }
            }

            &.skin-show {
                $value-skin-show-width: 110px;
                grid-row: span 3;
                min-width: $value-skin-show-width;
                height: 100%;

                .aurle-home-tag__background {
                    z-index: 2;
                    pointer-events: none;

                    canvas {
                        width: $value-skin-show-width !important;
                        height: 100% !important;
                        object-fit: cover;
                        filter: drop-shadow(0 0 8px var(--background-dark-0));
                        transform: rotate(-30deg) translate(20px, 25px);
                        transition: 350ms;
                    }
                }

                .aurle-home-tag__foreground {
                    justify-content: flex-end;

                    .aurle-home-tag__nick {
                        color: var(--color-text);
                        font-size: 18px;
                        font-weight: 600;
                    }

                    .aurle-home-tag__id {
                        color: var(--color-text--subtle);
                        font-family: 'Minecraft';
                    }
                }
            }

            &:hover {
                outline-color: var(--color-primary);

                &.small {
                    .aurle-home-tag__icons {
                        transform: perspective(60px) rotateX(25deg) rotateY(-20deg) translate(-25%, 35%) scale(1.35);
                    }
                }
            }
        }
    }
</style>