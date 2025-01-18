<template>
    <div class="aurle-home-interview">
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
        <div class="aurle-home-item">
        </div>
    </div>
</template>

<script setup lang="ts">

</script>

<style scoped lang="scss">
    @use '~/assets/styles/media_screen.scss' as media;
    
    .aurle-home-interview {
        display: grid;
        gap: 0.75rem;
        grid-template-columns: repeat(3, 1fr);

        .aurle-home-item {
            background: var(--background-light-4);
            backdrop-filter: blur(32px) saturate(1.25);
            border: 1px solid var(--border-color-base--darker);
            border-radius: 8px;
            padding: 0.75rem;
            box-shadow: 0 0 64px var(--border-color-base);
            position: relative;

            &.info {
                grid-column: span 3;
                padding: 0;
                text-align: center;
                overflow: hidden;

                .aurle-home-item__background {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    z-index: 4;

                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: linear-gradient(135deg, var(--background-color-primary--hover), var(--background-color-primary--active) 200%);
                    user-select: none;

                    img {
                        $image-length: 90px;
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
                    position: relative;
                    z-index: 5;
                    padding: 0.75rem 1.25rem;
                }

                .aurle-home-item__title {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    color: var(--color-text);
                    font-size: 32px;
                    font-weight: 600;
                }

                .aurle-home-item__subtitle {
                    font-size: 14px;
                }
            }
        }
    }
</style>