<template>
    <div class="aurle-home-tag project-show">
        <div class="aurle-home-tag__list">
            <div class="aurle-home-tag__item"></div>
            <div class="aurle-home-tag__item"></div>
            <div class="aurle-home-tag__item"></div>
        </div>
        <div class="aurle-home-tag__title">
            我の<br>
            <span class="emphasized">个人项目</span>
        </div>
    </div>
</template>

<style scoped lang="scss">
    @use '~/assets/styles/module/tags_global' as tags;

    .project-show {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: 0.5rem;
        min-width: 300px;
    }
</style>