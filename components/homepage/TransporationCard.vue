<template>
    <div class="aurle-home-tag transportation">
        <div class="aurle-home-tag__normal">
            <span class="material-icons">train</span>
        </div>
        <div class="aurle-home-tag__hover">
            <span class="text">交通</span>
        </div>
    </div>
</template>

<style scoped lang="scss">
    @use '~/assets/styles/module/tags_global' as tags;

    .transportation {
        display: flex;
        flex-direction: column;
        min-width: 32px;
        min-height: 32px;
        user-select: none;
        cursor: pointer;

        .aurle-home-tag__normal, .aurle-home-tag__hover {
            display: flex;
            justify-content: center;
            align-items: center;
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
        }

        .aurle-home-tag__normal {
            .material-icons {
                color: var(--color-text--subtle);
                font-size: 18px;
            }
        }

        .aurle-home-tag__hover {
            top: 100%;
            bottom: -100%;
            font-size: 12px;
            color: var(--color-surface-0);
            font-weight: 600;
            background: var(--color-primary);
            transition: tags.$value-transition-duration;
        }

        &:hover {
            .aurle-home-tag__hover {
                top: 0%;
                bottom: 0%;
            }
        }
    }
</style>