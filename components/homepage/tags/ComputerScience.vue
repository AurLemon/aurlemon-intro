<template>
    <div class="aurle-home-tag computer-science" v-tooltip.bottom="{ content: '可能有点泛，这里说的是数据结构，算法和计算机+操作系统原理' }">
        <div class="aurle-home-tag__background">
            <fa :icon="['fas', 'code-merge']" />
        </div>
        <div class="aurle-home-tag__foreground">
            <div class="aurle-home-tag__title">
                <div class="aurle-home-tag__tags">
                    <div class="aurle-home-tag__tag learning">在学</div>
                    <div class="aurle-home-tag__tag junior-mastering">兴趣</div>
                </div>
                <div class="emphasized">计算机科学</div>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
    @use '~/assets/styles/module/_tags_global' as tags;

    .aurle-home-tag.computer-science {
        .aurle-home-tag__background {
            display: flex;
            justify-content: flex-end;

            svg {
                color: var(--color-text--subtle);
                font-size: 54px;
                margin: 5px;
                opacity: 0.5;
                transform: scale(0.8) translate(15px, -15px) rotate(-10deg);
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
                    background: #5ec625;

                    &.junior-mastering {
                        background: #f79525;
                    }
                }
            }
        }

        &:hover {
            .aurle-home-tag__background {
                svg {
                    opacity: 0.9;
                    transform: scale(1) translate(10px, -10px) rotate(-10deg);
                }
            }
        }
    }
</style>