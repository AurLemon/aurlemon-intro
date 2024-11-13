<template>
    <div class="aurle-home-tag long-stick">
        写上去的不一定都会只是凑数排个版嘻嘻
    </div>
</template>

<style scoped lang="scss">
    @use '~/assets/styles/module/tags_global' as tags;

    .long-stick {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 0.25rem;
        color: var(--color-text--subtle);
        height: 100%;
        padding: 0.25rem 1rem;
        transition: tags.$value-transition-duration;
    }
</style>