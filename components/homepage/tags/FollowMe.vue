<template>
    <div class="aurle-home-tag follow-me">关注我🤤</div>
</template>

<style scoped lang="scss">
    @use '~/assets/styles/module/tags_global' as tags;

    .aurle-home-tag.follow-me {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 0.25rem;
        color: var(--color-surface-0);
        height: 100%;
        border: 1px solid var(--background-color-overlay);
        padding: 0.25rem 1rem;
        background: var(--color-primary);
        transition: tags.$value-transition-duration;
    }
</style>