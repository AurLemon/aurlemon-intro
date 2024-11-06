<template>
    <div class="aurle-page-sidebar">
        <div class="aurle-page-sidebar-buttons"></div>
        <div class="aurle-page-sidebar-logo">
            <img src="../assets/images/AurLemon_Avatar.jpg">
        </div>
    </div>
</template>

<style scoped lang="scss">
.aurle-page-sidebar {
    $value-sidebar-border-radius: 28px;
    display: flex;
    flex-direction: column;
    position: fixed;
    top: 15vh;
    padding: 12px 10px 12px 8px;
    border: 0.5px solid var(--background-dark-0);
    border-left: none;
    border-radius: 0 $value-sidebar-border-radius $value-sidebar-border-radius 0;
    background: #fff;
    box-shadow: 0 0 48px var(--background-dark-0);

    .aurle-page-sidebar-logo {
        width: 32px;
        height: 32px;

        img {
            display: block;
            width: 100%;
            height: 100%;
            border-radius: 50%;
        }
    }
}
</style>