<template>
    <div class="aurle-home-tag anime" v-tooltip.bottom="{ content: '这就是我们gbc啊你们有没有这样的gbc，另外关注芸草冰谢谢' }">
        <div class="aurle-home-tag__background">
            <img src="~/assets/images/homepage/GBC_1.jpg">
        </div>
        <div class="aurle-home-tag__foreground">
            <div class="aurle-home-tag__title">
                #GIRLS BAND CRY
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
    @use '~/assets/styles/module/tags_global' as tags;

    .aurle-home-tag.anime {
        .aurle-home-tag__background {
            img {
                display: block;
                width: 100%;
                object-fit: cover;
                object-position: top;
                transform: translate(0, -10%);
                transition: tags.$value-transition-duration;
            }
        }

        .aurle-home-tag__foreground {
            display: flex;
            justify-content: flex-end;
            flex-direction: column;
            padding: 0.5rem;
            background: linear-gradient(35deg, var(--background-dark-2) -50%, transparent 40%);

            .aurle-home-tag__title {
                color: var(--color-surface-0);
                font-size: 14px;
                font-weight: 600;
                text-shadow: 0 2px 2px var(--background-dark-2);
            }
        }

        &:hover {
            .aurle-home-tag__background {
                img {
                    filter: saturate(1.5);
                    transform: translate(20%, 5%) scale(1.5);
                }
            }
        }
    }
</style>