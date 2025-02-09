<template>
    <div class="aurle-home-tags">
        
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
</script>

<style lang="scss">
    @use '~/assets/styles/module/tags_global' as tags;
    @use '~/assets/styles/media_screen.scss' as media;

    .aurle-home-tags {
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
            box-shadow: 0 0 128px var(--border-color-base);
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