<template>
    <div class="aurle-home-tag dev-ops" v-tooltip.bottom="{ content: '牛魔的，名下三个域名全备案了，三个里面俩是在未成年的时候弄得' }">
        <div class="aurle-home-tag__background">
            <fa :icon="['fas', 'cloud']" />
        </div>
        <div class="aurle-home-tag__foreground">
            <div class="aurle-home-tag__title">
                <div class="aurle-home-tag__tags">
                    <div class="aurle-home-tag__tag">会一点点</div>
                </div>
                <div class="emphasized">云开发和运维</div>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
    @use '~/assets/styles/module/tags_global' as tags;

    .aurle-home-tag.dev-ops {
        .aurle-home-tag__background {
            display: flex;
            justify-content: flex-end;

            svg {
                color: var(--color-text--subtle);
                font-size: 54px;
                margin: 5px;
                opacity: 0.5;
                transform: scale(0.8) translate(25px, -15px) rotate(-10deg);
                transition: tags.$value-transition-duration;
            }
        }

        .aurle-home-tag__foreground {
            display: flex;
            justify-content: flex-end;
            flex-direction: column;
            padding: 0.5rem;

            .aurle-home-tag__title {
                display: flex;
                flex-direction: column;
                gap: 0.125rem;
            }

            .aurle-home-tag__tags {
                display: flex;
                flex-wrap: wrap;
                gap: 0.25rem;

                .aurle-home-tag__tag {
                    color: var(--color-surface-0);
                    font-size: 10px;
                    padding: 2px 6px;
                    border-radius: 8px;
                    background: var(--color-primary);
                }
            }
        }

        &:hover {
            .aurle-home-tag__background {
                svg {
                    opacity: 0.9;
                    transform: scale(0.9) translate(20px, -10px) rotate(-10deg);
                }
            }
        }
    }
</style>