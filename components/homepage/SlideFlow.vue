<script setup lang="ts">
import { ref } from 'vue'

interface FlowList {
    type: 'github' | 'tag'
    title: string
    description: string
    icon?: {
        type: string
        value: string
    }
    link?: string
}

const flowList = ref<FlowList[]>([
    {
        type: 'github',
        title: 'fjcpc-transfer-exam-practice-system',
        description: 'An unofficial exam practice system for Chuanzheng College transfer exam, based on the Fujian Chuanzheng Communications College transfer examination system.'
    },
    {
        type: 'github',
        title: 'fjcpc-transfer-exam-practice-system',
        description: 'An unofficial exam practice system for Chuanzheng College transfer exam, based on the Fujian Chuanzheng Communications College transfer examination system.'
    },
    {
        type: 'github',
        title: 'fjcpc-transfer-exam-practice-system',
        description: 'An unofficial exam practice system for Chuanzheng College transfer exam, based on the Fujian Chuanzheng Communications College transfer examination system.'
    },
    {
        type: 'github',
        title: 'fjcpc-transfer-exam-practice-system',
        description: 'An unofficial exam practice system for Chuanzheng College transfer exam, based on the Fujian Chuanzheng Communications College transfer examination system.'
    },
    {
        type: 'github',
        title: 'fjcpc-transfer-exam-practice-system',
        description: 'An unofficial exam practice system for Chuanzheng College transfer exam, based on the Fujian Chuanzheng Communications College transfer examination system.'
    },
    {
        type: 'github',
        title: 'fjcpc-transfer-exam-practice-system',
        description: 'An unofficial exam practice system for Chuanzheng College transfer exam, based on the Fujian Chuanzheng Communications College transfer examination system.'
    },
    {
        type: 'github',
        title: 'fjcpc-transfer-exam-practice-system',
        description: 'An unofficial exam practice system for Chuanzheng College transfer exam, based on the Fujian Chuanzheng Communications College transfer examination system.'
    },
    {
        type: 'github',
        title: 'fjcpc-transfer-exam-practice-system',
        description: 'An unofficial exam practice system for Chuanzheng College transfer exam, based on the Fujian Chuanzheng Communications College transfer examination system.'
    },
    {
        type: 'github',
        title: 'fjcpc-transfer-exam-practice-system',
        description: 'An unofficial exam practice system for Chuanzheng College transfer exam, based on the Fujian Chuanzheng Communications College transfer examination system.'
    },
    {
        type: 'github',
        title: 'fjcpc-transfer-exam-practice-system',
        description: 'An unofficial exam practice system for Chuanzheng College transfer exam, based on the Fujian Chuanzheng Communications College transfer examination system.'
    }
])
</script>

<template>
    <div class="aurle-home-flow">
        <div class="aurle-home-item" v-for="(flow, key) in flowList" :key="key" :class="{ odd: key % 2 === 1 }">
            <a href="">
                <div class="aurle-home-item__icon"></div>
                <div class="aurle-home-item__title">{{ flow.title }}</div>
            </a>
        </div>
    </div>
</template>

<style lang="scss">
    @use '~/assets/styles/media_screen.scss' as media;

    .aurle-home-flow {
        position: absolute;
        bottom: 0;
        z-index: 4;
        width: 100%;
        mask-image: radial-gradient(ellipse at bottom, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0.25) 55%, transparent 75%);
        opacity: 0.95;

        display: grid;
        grid-template-columns: repeat(6, 1fr);
        gap: 0.5rem;

        @include media.media-screen(pad) {
            grid-template-columns: repeat(8, 1fr);
        }

        @include media.media-screen(phone) {
            grid-template-columns: repeat(4, 1fr);
        }

        .aurle-home-item {
            border: 1px solid var(--border-color-base);
            border-radius: 12px;
            padding: 0.75rem;

            &.odd {
                transform: translateY(25%);
            }
        }
    }
</style>