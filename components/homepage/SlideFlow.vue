<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

import FrontendCard from './tags/FrontendCard.vue'
import BackendCard from './tags/BackendCard.vue'
import MiFans from './tags/MiFans.vue'
import EmbeddedDev from './tags/EmbeddedDev.vue'
import ProjectShow from './tags/ProjectShow.vue'
import ComputerScience from './tags/ComputerScience.vue'
import DevOps from './tags/DevOps.vue'
import LongStick from './tags/LongStick.vue'
import FollowMe from './tags/FollowMe.vue'
import MinecraftCard from './tags/MinecraftCard.vue'
import SkinShow from './tags/SkinShow.vue'
import AnimeCard from './tags/AnimeCard.vue'
import TransporationCard from './tags/TransporationCard.vue'
import CollegeCard from './tags/CollegeCard.vue'
import PersonalityCard from './tags/PersonalityCard.vue'
import TodoList from './tags/TodoList.vue'
</script>

<template>
    <div class="aurle-home-flow">
        <FrontendCard />
        <BackendCard /> 
        <MiFans /> 
        <EmbeddedDev />
        <ProjectShow />
        <ComputerScience />
        <DevOps />
        <LongStick />
        <FollowMe />
        <MinecraftCard />
        <SkinShow />
        <AnimeCard />
        <TransporationCard />
        <CollegeCard />
        <PersonalityCard />
        <TodoList />
    </div>
</template>

<style lang="scss">
    @use '~/assets/styles/module/tags_global' as tags;
    @use '~/assets/styles/media_screen.scss' as media;

    .aurle-home-flow {
        position: absolute;
        bottom: 0;
        z-index: 4;
        width: 100%;
        height: 280px;
        padding: 0 2rem;
        padding-bottom: 0.5rem;
        mask-image: linear-gradient(to bottom, transparent, #fff);
        transform: rotateX(40deg);
        transform-style: preserve-3d;
        will-change: transform;

        display: grid;
        grid-template-rows: repeat(5, auto);
        grid-auto-flow: column;
        grid-gap: 0.325rem;
        font-size: 14px;

        @include media.media-screen(mobile) {
            grid-template-columns: repeat(4, auto);
            grid-template-rows: auto;
            grid-auto-flow: row;
        }

        @include media.media-screen(phone) {
            width: 100%;
            grid-template-columns: repeat(2, 1fr);
        }

        .aurle-home-tag {
            font-size: 12px;
            border: 1px solid var(--border-color-base);
            outline: 2px solid transparent;
            border-radius: 8px;
            background: #fff;
            box-shadow: 0 0 32px var(--border-color-base);
            position: relative;
            overflow: hidden;
            transition: tags.$value-transition-duration;

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
                padding: 0.5rem;
                position: relative;
                z-index: 1;
            }

            .aurle-home-tag__title {
                color: var(--color-text--subtle);

                .emphasized {
                    color: var(--color-text);
                    font-size: 18px;
                    font-weight: 600;
                }
            }

            &.active-card {
                min-width: 130px;
                min-height: 140px;
                cursor: pointer;

                .aurle-home-tag__background {
                    display: flex;
                    justify-content: flex-end;

                    .aurle-home-tag__icons {
                        width: fit-content;
                        user-select: none;

                        .aurle-home-tag__icon {
                            transform: translate(15%, -10%) rotate(4deg);
                            opacity: 0.3;
                            filter: saturate(0.75);
                            transition: tags.$value-transition-duration;

                            img, svg {
                                $value-icon-width: 76px;
                                display: block;
                                width: $value-icon-width;
                                height: $value-icon-width;
                                object-fit: contain
                            }
                        }
                    }
                }

                .aurle-home-tag__foreground {
                    justify-content: flex-end;
                    padding: 0;

                    .aurle-home-tag__normal, .aurle-home-tag__active {
                        display: flex;
                        flex-direction: column;
                        justify-content: flex-end;
                        gap: 0.25rem;
                        padding: 0.5rem;
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        z-index: 3;
                        transition: tags.$value-transition-duration;
                    }

                    .aurle-home-tag__active {
                        left: -100%;
                        right: 100%;
                        transform: scale(0.7);
                        opacity: 0;

                        .aurle-home-tag__title {
                            font-size: 14px;
                            font-weight: 600;
                            margin-top: 1.5rem;
                        }

                        .aurle-home-tag__desc {
                            font-size: 10px;
                            word-break: break-all;
                            margin-bottom: auto;
                        }
                    }

                    .aurle-home-tag__tags {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 0.125rem;
                        font-size: 10px;
                        font-weight: 600;

                        .aurle-home-tag__tag {
                            color: var(--color-primary);
                            border: 1px solid var(--color-primary);
                            border-radius: 16px;
                            padding: 2px 4px;
                        }
                    }
                }

                &:hover {
                    .aurle-home-tag__background {
                        .aurle-home-tag__icons {
                            .aurle-home-tag__icon {
                                transform: translate(15%, -10%) rotate(6deg) scale(0.8);
                                opacity: 0.6;
                                filter: saturate(0.8);
                            }
                        }
                    }
                }

                &:active {
                    transform: scale(0.98);
                    transition-duration: 80ms;
                }

                &.active {
                    .aurle-home-tag__background {
                        .aurle-home-tag__icons {
                            .aurle-home-tag__icon {
                                transform: translate(25%, -20%) rotate(10deg) scale(0.75);
                                opacity: 0.9;
                                filter: saturate(0.9);
                            }
                        }
                    }
                
                    .aurle-home-tag__foreground {
                        .aurle-home-tag__normal {
                            left: -100%;
                            right: 100%;
                            transform: scale(0.7);
                            opacity: 0;
                        }

                        .aurle-home-tag__active {
                            left: 0;
                            right: 0;
                            transform: scale(1);
                            opacity: 1;
                        }

                        .aurle-home-tag__tags {
                            font-size: 10px;

                            .aurle-home-tag__tag {
                                color: var(--color-primary);
                                border: 1px solid var(--color-primary);
                                border-radius: 4px;
                                padding: 2px 4px;
                                transition: tags.$value-transition-duration;

                                &.active, &:hover {
                                    color: var(--color-surface-0);
                                    background: var(--color-primary);
                                }
                            }
                        }
                    }
                }
            }

            &.frontend-dev {
                grid-column: 1 / span 2;
                grid-row: 1 / span 3;
            }

            &.backend-dev {
                grid-column: 3 / span 2;
                grid-row: 2 / span 3;
            }

            &.mi-fans {
                grid-column: 3 / span 2;
                grid-row: 1;
            }

            &.embedded-dev {
                grid-column: 3 / span 2;
                grid-row: 5;
            }

            &.computer-science {
                grid-column: 1 / span 2;
                grid-row: 4 / span 2;
            }

            &.dev-ops {
                grid-column: 5 / span 3;
                grid-row: 5;
            }

            &.long-stick {
                grid-column: span 4;
                grid-row: span 1;
            }

            &.project-show {
                grid-column: 5 / span 5;
                grid-row: 1 / span 3;
            }

            &.follow-me {
                grid-column: span 1;
                grid-row: 4;
            }

            &.transportation {
                grid-column: 13 / span 2;
                grid-row: 5;
            }

            &.college {
                grid-column: 11 / span 4;
                grid-row: 3 / span 2;
            }

            &.minecraft {
                grid-column: 8 / span 2;
                grid-row: 5;
            }

            &.anime {
                grid-column: 10 / span 3;
                grid-row: 5;
            }

            &.skin-show {
                grid-column: 10;
                grid-row: 1 / span 4;
            }

            &.personality {
                grid-column: span 2;
                grid-row: span 2;
            }

            &.todo-list {
                grid-column: span 2;
                grid-row: span 2;
            }

            @include media.media-screen(mobile) {
                &.frontend-dev {
                    grid-column: 1;
                    grid-row: 3;
                }

                &.backend-dev {
                    grid-column: 2;
                    grid-row: 3;
                }

                &.mi-fans {
                    grid-column: auto;
                    grid-row: auto;
                }

                &.embedded-dev {
                    grid-column: auto;
                    grid-row: auto;
                }

                &.computer-science {
                    grid-column: 2;
                    grid-row: 5;
                }

                &.dev-ops {
                    grid-column: 4;
                    grid-row: 4;
                }

                &.long-stick {
                    grid-column: 4;
                    grid-row: 5;
                }

                &.project-show {
                    grid-column: 1 / span 4;
                    grid-row: 1 / span 2;
                    min-height: 300px;
                }

                &.follow-me {
                    grid-column: auto;
                    grid-row: auto;
                }

                &.transportation {
                    grid-column: auto;
                    grid-row: auto;
                }

                &.college {
                    grid-column: 4;
                    grid-row: 6;
                }

                &.minecraft {
                    grid-column: auto;
                    grid-row: auto;
                }

                &.anime {
                    grid-column: 4;
                    grid-row: 3;
                }

                &.skin-show {
                    grid-column: 3;
                    grid-row: 3 / span 2;
                }

                &.personality {
                    grid-column: auto;
                    grid-row: auto;
                }

                &.todo-list {
                    grid-column: auto;
                    grid-row: auto;
                }
            }

            @include media.media-screen(phone) {
                &.frontend-dev {
                    grid-column: 1;
                    grid-row: 3 / span 2;
                }

                &.backend-dev {
                    grid-column: 1;
                    grid-row: 5 / span 2;
                }

                &.mi-fans {
                    grid-column: 1;
                    grid-row: 7;
                }

                &.embedded-dev {
                    grid-column: auto;
                    grid-row: auto;
                }

                &.computer-science {
                    grid-column: 2;
                    grid-row: 6;
                }

                &.dev-ops {
                    grid-column: auto;
                    grid-row: 7;
                }

                &.long-stick {
                    grid-column: 1 / span 2;
                    grid-row: 14;
                }

                &.project-show {
                    grid-column: 1 / span 2;
                    grid-row: 1 / span 2;
                    min-height: 300px;
                }

                &.follow-me {
                    grid-column: auto;
                    grid-row: auto;
                }

                &.transportation {
                    grid-column: auto;
                    grid-row: auto;
                }

                &.college {
                    grid-column: 1 / span 2;
                    grid-row: 10;
                }

                &.minecraft {
                    grid-column: auto;
                    grid-row: auto;
                }

                &.anime {
                    grid-column: 1 / span 2;
                    grid-row: 12 / span 2;
                    min-height: 200px;
                }

                &.skin-show {
                    grid-column: 2;
                    grid-row: 3 / span 3;
                }

                &.personality {
                    grid-column: auto;
                    grid-row: 11;
                }

                &.todo-list {
                    grid-column: auto;
                    grid-row: 11;
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