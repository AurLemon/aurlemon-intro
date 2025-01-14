<script setup lang="ts">
import { ref, onMounted, onBeforeMount } from 'vue'
import { gsap } from 'gsap'
import { useInfoPanel } from '~/stores/infoPanel'

const infoPanel = useInfoPanel()

const panelRef = ref<HTMLElement | null>(null)

const onAfterEnter = () => {
    if (panelRef.value) {
        panelRef.value.classList.add('finish')
    }
}

const onBeforeLeave = () => {
    if (panelRef.value) {
        panelRef.value.classList.remove('finish')
    }
}

const closePanel = () => {
    if (infoPanel.panelStatus) infoPanel.togglePanel()
}

const handleKeydown = (e: KeyboardEvent) => {
    switch (e.key) {
        case 'Escape':
            closePanel()
            break
    }
}

onMounted(() => {
    document.addEventListener('keydown', handleKeydown)
})

onBeforeMount(() => {
    document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
    <transition name="panel-fade" @after-enter="onAfterEnter" @before-leave="onBeforeLeave">
        <aside class="aurle-panel" v-if="infoPanel.panelStatus" ref="panelRef">
            <div class="aurle-panel-building">
                信息面板慢慢做，不急。
            </div>
        </aside>
    </transition>
</template>

<style scoped lang="scss">
    .aurle-panel {
        display: flex;
        justify-content: center;
        align-items: center;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 100000;
        padding: 1rem;
        background-color: var(--background-light-1);
        backdrop-filter: blur(64px) saturate(1.5);
        opacity: 0;
        transform: translateY(-100%);
        transition: transform 400ms ease, opacity 400ms ease;


        &.finish {
            transform: translateY(0);
            opacity: 1;
        }
    }

    .panel-fade-enter-to {
        transform: translateY(0);
        opacity: 1;
    }

    .panel-fade-enter,
    .panel-fade-leave-to {
        transform: translateY(-100%) !important;
        opacity: 0 !important;
    }
</style>