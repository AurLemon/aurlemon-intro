<template>
    <div class="aurle-home-tag project-show">
        <div class="aurle-home-tag__list">
            <div class="aurle-home-tag__item">
                <div class="aurle-home-tag__background">
                </div>
                <div class="aurle-home-tag__foreground">
                    <div class="aurle-home-tag__title"></div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
    @use '~/assets/styles/module/tags_global' as tags;

    .aurle-home-tag.project-show {
        min-width: 300px;

        .aurle-home-tag__list {
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            align-items: center;
            position: relative;

            .aurle-home-tag__item {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                width: 100%;
                height: 100%;
                padding: 0.5rem;
                transition: 350ms;
            }
        }
    }
</style>