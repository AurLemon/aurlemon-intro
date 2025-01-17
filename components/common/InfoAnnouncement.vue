<template>
    <div class="aurle-announcement" :class="{ expand: isLoaded }" @click="closeAnnouncement">
        <div class="aurle-announcement-item" v-for="info in utilsConfig.announcement" :key="info.id">
            <div class="aurle-announcement-item__icon">
                <span class="material-icons" v-if="info.icon.type === 'material-icons'">{{ info.icon.content }}</span>
            </div>
            <div class="aurle-announcement-item__message">
                {{ info.message }}
            </div>
            <div class="aurle-announcement-item__links">
                <div class="aurle-announcement-item__link" v-for="(link, index) in info.more_info" v-if="info.more_info" :key="index">
                    <a :href="link.url" target="_blank" rel="noopener noreferrer">{{ link.text === 'GitHub' ? 'GitHub' : '未知' }}</a>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue"

import utilsConfigData from "~/assets/utils/config.json"
import type Config from "~/assets/utils/config.d"

const utilsConfig: Config = utilsConfigData

const isLoaded = ref(false)

const closeAnnouncement = () => {
    isLoaded.value = false
}

onMounted(() => {
    setTimeout(() => {
        isLoaded.value = true
    }, 1000)
})
</script>

<style scoped lang="scss">
    .aurle-announcement {
        display: flex;
        align-items: center;
        flex-direction: column;
        position: fixed;
        right: 1.5rem;
        bottom: 2rem;
        z-index: 1;
        transform: scaleY(0);
        transition: 300ms;
        pointer-events: none;

        .aurle-announcement-item {
            display: flex;
            align-items: center;
            gap: 0.25rem;
            color: var(--color-text--subtle);
            font-size: 14px;
            font-weight: 600;
            width: 100%;
            max-width: 350px;
            padding: 0.75rem;
            border: 1px solid var(--border-color-base--darker);
            border-radius: 8px;
            background-color: var(--color-surface-0);
            box-shadow: 0 0 64px var(--border-color-base);
            pointer-events: all;

            .aurle-announcement-item__icon {
                .material-icons {
                    display: block;
                    font-size: 16px;
                }
            }

            .aurle-announcement-item__links {
                margin-left: 1rem;

                .aurle-announcement-item__link {
                    a {
                        display: block;
                        padding: 0.125rem 0.25rem;
                        border: 1px solid var(--border-color-base--darker);
                        border-radius: 4px;
                        background: var(--color-surface-0);
                        cursor: pointer;
                        transition: 350ms;

                        &:hover {
                            color: var(--color-surface-0);
                            background: var(--color-primary);
                        }
                    }
                }
            }
        }

        &.expand {
            transform: scaleY(1);
        }
    }
</style>