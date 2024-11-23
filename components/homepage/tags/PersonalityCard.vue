<template>
    <div class="aurle-home-tag personality">
        <div class="aurle-home-tag__background">
            <div class="emoji">😋</div>
        </div>
        <div class="aurle-home-tag__foreground">
            <div class="aurle-home-tag__subtitle">抽象神经发电</div>
            <div class="aurle-home-tag__title">喜不喜欢</div>
        </div>
    </div>
</template>

<style scoped lang="scss">
    @use '~/assets/styles/module/tags_global' as tags;

    .aurle-home-tag.personality {
        .aurle-home-tag__background {
            display: flex;
            justify-content: flex-end;
            z-index: 2;

            .emoji {
                font-size: 54px;
                opacity: 0.2;
                filter: saturate(0.75);
                width: fit-content;
                height: fit-content;
                transform: translate(20px, -20px) rotate(-25deg);
                transition: tags.$value-transition-duration;
                pointer-events: none;
                user-select: none;
            }
        }

        .aurle-home-tag__foreground {
            justify-content: flex-end;

            .aurle-home-tag__subtitle {
                color: var(--color-text--subtle);
                font-size: 12px;
            }

            .aurle-home-tag__title {
                color: var(--color-text);
                font-size: 18px;
                font-weight: 600;
                margin-top: 0;
                height: 24px;
            }
        }

        &:hover {
            .aurle-home-tag__background {
                .emoji {
                    opacity: 1;
                    filter: saturate(0.9) drop-shadow(0 0 8px var(--background-dark-0));
                    transform: translate(20px, -20px) rotate(0deg) scale(0.5);
                }
            }
        }
    }
</style>