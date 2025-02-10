<template>
    <div class="aurle-home-basic">
        <div class="aurle-home-item info">
            <div class="aurle-home-item__background">
                <img src="~/assets/images/AurLemon_Avatar.jpg" />
                <div class="text">AurLemon</div>
                <img src="~/assets/images/AurLemon_Avatar.jpg" />
            </div>
            <div class="aurle-home-item__foreground">
                <div class="aurle-home-item__title">奥若拉柠檬</div>
                <div class="aurle-home-item__subtitle">你可以这么叫我。</div>
            </div>
        </div>
        <div class="aurle-home-item s-card location">
            <div class="aurle-home-item__background">
                <img src="~/assets/images/homepage/Ass_tree.png" />
            </div>
            <div class="aurle-home-item__foreground">
                <div class="aurle-home-item__title">福建福州</div>
                <div class="aurle-home-item__subtitle">闽A没啥玩的哈。</div>
            </div>
        </div>
        <div class="aurle-home-item s-card birthdate">
            <div class="aurle-home-item__background">
                <span class="material-icons">calendar_month</span>
            </div>
            <div class="aurle-home-item__foreground">
                <div class="aurle-home-item__title">2006 · 男</div>
                <div class="aurle-home-item__subtitle">我也成老登了。</div>
            </div>
        </div>
        <div class="aurle-home-item s-card education">
            <div class="aurle-home-item__background">
                <img src="~/assets/images/badge/FJCCC_Logo.png" />
            </div>
            <div class="aurle-home-item__foreground">
                <div class="aurle-home-item__title">在读学生</div>
                <div class="aurle-home-item__subtitle">目前大（专）一，计算机应用技术，大专特有的。</div>
            </div>
        </div>
        <div class="aurle-home-item s-card attributes">
            <div class="aurle-home-item__background">
                <span class="material-icons">accessible_forward</span>
            </div>
            <div class="aurle-home-item__foreground">
                <div class="aurle-home-item__title">INF/TJ</div>
                <div class="aurle-home-item__subtitle">测着玩玩。有一种赛博算卦的感觉。</div>
            </div>
        </div>
        <div class="aurle-home-item s-card gene">
            <div class="aurle-home-item__background">
                <span class="material-icons">fork_left</span>
            </div>
            <div class="aurle-home-item__foreground">
                <div class="aurle-home-item__title">O-MF13779</div>
                <div class="aurle-home-item__subtitle">Y 染色体遗传标记。</div>
            </div>
        </div>
        <div class="aurle-home-item s-card abstract">
            <div class="aurle-home-item__background">
                <span class="material-icons">boy</span>
            </div>
            <div class="aurle-home-item__foreground">
                <div class="aurle-home-item__title">我是SB</div>
                <div class="aurle-home-item__subtitle">不知道写什么了。</div>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
    @use '~/assets/styles/media_screen.scss' as media;
    
    .aurle-home-basic {
        display: grid;
        gap: 0.5rem;
        grid-template-columns: repeat(4, 1fr);

        .aurle-home-item {
            background: var(--background-light-4);
            backdrop-filter: blur(32px) saturate(1.25);
            border-radius: 8px;
            outline: 1.75px solid transparent;
            position: relative;
            min-height: 64px;
            transition: 250ms;

            .aurle-home-item__background {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 4;
                user-select: none;
            }

            .aurle-home-item__foreground {
                position: relative;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 5;
                height: 100%;
            }

            &.info {
                grid-column: span 2;
                grid-row: span 3;
                text-align: center;
                padding: 0;
                border: 1px solid var(--border-color-base--darker);
                overflow: hidden;

                .aurle-home-item__background {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: linear-gradient(135deg, var(--background-color-primary--hover), var(--background-color-primary--active) 200%);
                    user-select: none;

                    img {
                        $image-length: 80px;
                        display: block;
                        width: $image-length;
                        height: $image-length;
                        object-fit: cover;
                        border: 2px solid var(--background-color-primary--active);
                        border-radius: 50%;
                        box-shadow: 0 0 256px var(--color-primary);

                        &:first-of-type {
                            transform: translate(-10%, 25%);
                        }

                        &:last-of-type {
                            transform: translate(10%, -25%);
                        }
                    }

                    .text {
                        color: var(--color-surface-0);
                        text-shadow: 0 0 24px var(--background-dark-0);
                        font-size: 80px;
                        font-family: 'Caveat';
                        font-weight: 600;
                        opacity: 0.4;
                        transform: rotate(-2.5deg) scale(1.25);
                    }
                }

                .aurle-home-item__foreground {
                    padding: 0.75rem 1.25rem;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                }

                .aurle-home-item__title {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    color: var(--color-text);
                    font-size: 36px;
                    font-weight: 600;
                }

                .aurle-home-item__subtitle {
                    font-size: 14px;
                }
            }

            &.s-card {
                $image-length: 50px;
                overflow: hidden;
                grid-row: span 2;

                .aurle-home-item__background {
                    display: flex;
                    align-items: flex-end;

                    img, svg, span {
                        display: block;
                        margin-left: auto;
                        margin-right: 0.375rem;
                        width: $image-length;
                        font-size: $image-length;
                        height: 100%;
                        object-fit: contain;
                    }

                    span {
                        color: var(--color-text--subtle);
                        display: block;
                        height: fit-content;
                        margin-top: auto;
                        margin-bottom: auto;
                    }
                }

                .aurle-home-item__foreground {
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    padding: 0.75rem 0.5rem;
                    padding-right: $image-length;
                    background: linear-gradient(-45deg, rgba(185, 230, 253, 0.25), transparent 70%),
                                radial-gradient(circle at bottom left, transparent 0% 10%, rgba(184, 213, 225, 0.1) 10% 20%, transparent 20% 100%);

                    .aurle-home-item__title {
                        font-size: 18px;
                        font-weight: 600;
                    }

                    .aurle-home-item__subtitle {
                        color: var(--color-text--subtle);
                        font-size: 12px;
                    }
                }
            }

            &.location {
                .aurle-home-item__background {
                    img, svg {
                        object-position: bottom;
                    }
                }

                .aurle-home-item__foreground {
                    background: linear-gradient(-45deg, rgba(190, 225, 187, 0.25), transparent 70%),
                                radial-gradient(circle at bottom left, transparent 0% 10%, rgba(196, 225, 184, 0.1) 10% 20%, transparent 20% 100%);
                }
            }

            &.education {
                grid-row: span 3;

                .aurle-home-item__foreground {
                    background: linear-gradient(-45deg, rgba(156, 183, 221, 0.25), transparent 70%),
                                radial-gradient(circle at bottom left, transparent 0% 10%, rgba(184, 196, 225, 0.1) 10% 20%, transparent 20% 100%);
                }
            }

            &.attributes {
                grid-row: span 3;
            }

            &:hover {
                outline-color: var(--color-primary);
            }
        }
        
        @include media.media-screen(mobile) {
            grid-template-columns: repeat(2, 1fr);
        }
    }
</style>