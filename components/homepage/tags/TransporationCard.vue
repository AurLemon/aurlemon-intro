<template>
    <div class="aurle-home-tag transportation" v-tooltip.bottom="{ content: '其实轨交圈好久没关注了' }">
        <div class="aurle-home-tag__background">
            <img src="~/assets/images/homepage/Fuzhou_Metro_Line_4.png">
        </div>
        <div class="aurle-home-tag__foreground">
            <div class="aurle-home-tag__title">
                公共交通
            </div>
            <div class="aurle-home-tag__roadmap">
                <div class="aurle-home-tag__scroll">
                    <div class="aurle-home-tag__circle"></div>
                    <div class="aurle-home-tag__circle"></div>
                    <div class="aurle-home-tag__circle"></div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
    @use '~/assets/styles/module/tags_global' as tags;

    .aurle-home-tag.transportation {
        $value-roadmap-color: var(--color-primary);

        .aurle-home-tag__background {
            display: flex;
            justify-content: flex-end;

            img {
                display: block;
                width: 100%;
                height: 100%;
                filter: drop-shadow(0 8px 12px var(--background-dark-0));
                transform: translate(62%, 0) scale(0.8);
                object-fit: cover;
                user-select: none;
                transition: tags.$value-transition-duration;
            }
        }

        .aurle-home-tag__foreground {
            display: flex;
            justify-content: center;
            flex-direction: column;
            padding: 0;

            .aurle-home-tag__title {
                font-size: 16px;
                font-weight: 600;
                padding: 0.5rem 0.25rem 0.125rem 0.25rem;
            }

            .aurle-home-tag__roadmap {
                $value-total-child: 3;
                width: 68px;
                height: 3px;
                margin: 4px 0;
                border-top-right-radius: 8px;
                border-bottom-right-radius: 8px;
                background: var(--color-surface-3);
                position: relative;

                .aurle-home-tag__scroll {
                    // width: calc(100% / $value-total-child);
                    width: 0%;
                    height: inherit;
                    background: $value-roadmap-color;
                    border-top-right-radius: 8px;
                    border-bottom-right-radius: 8px;
                    transition: tags.$value-transition-duration * 1.5;
                }

                .aurle-home-tag__circle {
                    position: absolute;
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    top: 50%;
                    transform: translateY(-50%);
                    background: var(--color-surface-4);
                    transition: tags.$value-transition-duration * 1.5;

                    &::before {
                        content: '';
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        width: 5px;
                        height: 5px;
                        border-radius: 50%;
                        background: #fff;
                    }

                    // &:first-child {
                    //     background: $value-roadmap-color;
                    // }

                    @for $i from 1 through $value-total-child {
                        &:nth-last-child(#{$i}) {
                            right: calc(100% / $value-total-child) * ($i - 1);
                        }
                    }
                }
            }
        }

        &:hover {
            .aurle-home-tag__background {
                img {
                    transform: translate(60%, 0) scale(0.9);
                }
            }

            .aurle-home-tag__foreground {
                .aurle-home-tag__roadmap {
                    .aurle-home-tag__scroll {
                        width: 100%;
                    }

                    .aurle-home-tag__circle {
                        background: $value-roadmap-color;
                    }
                }
            }
        }
    }
</style>