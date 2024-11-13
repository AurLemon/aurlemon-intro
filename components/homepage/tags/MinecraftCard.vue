<template>
    <div class="aurle-home-tag minecraft">
        <div class="aurle-home-tag__title">
            Build & BedWars<br>
            <span class="emphasized">Minecraft</span>
        </div>
        <div class="aurle-home-tag__axe">
            <img src="~/assets/images/icons/Wooden_Axe.png" alt="">
        </div>
    </div>
</template>

<style scoped lang="scss">
    @use '~/assets/styles/module/tags_global' as tags;

    .minecraft {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem;

        .aurle-home-tag__axe {
            img {
                display: block;
                width: 2rem;
                height: 2rem;
                transition: tags.$value-transition-duration;
            }
        }

        .aurle-home-tag__title {
            margin-top: 0;
        }

        &:hover {
            .aurle-home-tag__axe {
                img {
                    filter: brightness(1.5) drop-shadow(0px 0px 6px rgba(191, 158, 92, 0.4));
                    transform: scale(1.2) rotate(-25deg);
                }
            }
        }
    }
</style>