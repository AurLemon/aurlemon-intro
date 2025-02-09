<template>
    <div class="aurle-home-interest">

    </div>
</template>

<style scoped lang="scss">
    @use '~/assets/styles/media_screen.scss' as media;
    
    .aurle-home-interest {
        display: grid;
        gap: 0.5rem;
        grid-template-columns: repeat(4, 1fr);

        .aurle-home-item {
            background: var(--background-light-4);
            backdrop-filter: blur(32px) saturate(1.25);
            border-radius: 8px;
            outline: 1.75px solid transparent;
            box-shadow: 0 0 64px var(--border-color-base);
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
        }
    }
</style>