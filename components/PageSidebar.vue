<template>
    <aside class="aurle-page-sidebar">
        <div class="aurle-page-sidebar-buttons"></div>
        <div class="aurle-page-sidebar-arrow">
            <span class="material-icons">keyboard_arrow_down</span>
        </div>
    </aside>
</template>

<style scoped lang="scss">
.aurle-page-sidebar {
    $value-sidebar-border-radius: 28px;
    display: flex;
    flex-direction: column;
    position: fixed;
    right: 15vw;
    padding: 12px 8px 10px 8px;
    border: 0.5px solid var(--background-dark-0);
    border-top: none;
    border-radius: 0 0 $value-sidebar-border-radius $value-sidebar-border-radius;
    background: #fff;
    box-shadow: 0 0 48px var(--background-dark-0);

    .aurle-page-sidebar-arrow {
        user-select: none;
        
        .material-icons {
            display: block;
            color: var(--color-primary);
            font-size: 28px;
        }
    }
}
</style>