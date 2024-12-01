<script setup lang="ts">
import InfoPanel from './InfoPanel.vue';
import { useInfoPanel } from '~/stores/infoPanel'

const infoPanel = useInfoPanel()
</script>

<template>
    <div class="aurle-page-sidebar">
        <InfoPanel />
        <div class="aurle-page-sidebar-arrow" @click="infoPanel.togglePanel" :class="{ active: infoPanel.panelStatus }">
            <span class="material-icons" v-if="!infoPanel.panelStatus">keyboard_arrow_down</span>
            <span class="material-icons" v-else>close</span>
        </div>
    </div>
</template>

<style scoped lang="scss">
    @use '~/assets/styles/media_screen.scss' as media;

    .aurle-page-sidebar {
        .aurle-page-sidebar-arrow {
            $value-sidebar-border-radius: 28px;
            display: flex;
            flex-direction: column;
            position: fixed;
            right: 15vw;
            z-index: 100001;
            padding: 1rem 6px 6px 6px;
            border: 0.5px solid var(--background-dark-0);
            border-top: none;
            border-radius: 0 0 $value-sidebar-border-radius $value-sidebar-border-radius;
            background: #fff;
            box-shadow: 0 0 48px var(--background-dark-0);
            transition: 250ms;
            transform: translateY(-10px);
            cursor: pointer;
            
            .material-icons {
                display: block;
                color: var(--color-primary);
                font-size: 24px;
                user-select: none;
            }

            &:hover {
                transform: translateY(0);
            }

            &:active {
                transform: scale(0.95);
                transition-duration: 80ms;
            }

            &.active {
                right: 1.5rem;
                bottom: 2.5rem;
                padding: 8px;
                transform: translateY(0);
                border-top: unset;
                border-radius: $value-sidebar-border-radius;

                .material-icons {
                    color: var(--failed-color);
                }

                &:hover {
                    transform: translateY(2px);
                }
            }

            @include media.media-screen(mobile) {
                right: 1.5rem;
                bottom: 2.5rem;
                padding: 8px;
                transform: rotate(180deg);
                border-top: unset;
                border-radius: $value-sidebar-border-radius;
            }
        }
    }
</style>