<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const currentCollegeStage = ref<'middle' | 'high' | 'college'>('college');

const collegeStageInfo = ref<{
    [key in 'middle' | 'high' | 'college']: {
        stage: string;
        name: string;
        info: string;
    }
}>({
    middle: {
        stage: '初中',
        name: "福州屏东中学",
        info: '老师好学校也好'
    },
    high: {
        stage: '中职 (3+2)',
        name: "福建工贸学校",
        info: '给我爽了三年'
    },
    college: {
        stage: '高职 (3+2)',
        name: "福建船政交通职业学院",
        info: '臭大专屁事还多'
    }
})

const changeCurrentCollegeStage = (stage: string) => {
    switch (stage) {
        case 'middle':
            currentCollegeStage.value = 'middle'
            break
        case 'high':
            currentCollegeStage.value = 'high'
            break
        case 'college':
            currentCollegeStage.value = 'college'
            break
        default:
            break
    }
}

const currentCollegeInfo = computed(() => {
    const info = collegeStageInfo.value[currentCollegeStage.value];
    return info ? info : { stage: '未知', name: '不知道', info: '不知道' };
})
</script>

<template>
    <div class="aurle-home-tag college">
        <div class="aurle-home-tag__school">
            <div class="aurle-home-tag__badge" :class="{ current: currentCollegeStage === 'college'}" @click="changeCurrentCollegeStage('college')" @mouseenter="changeCurrentCollegeStage('college')">
                <img src="~/assets/images/badge/FJCCC_Logo.png" />
            </div>
            <div class="aurle-home-tag__badge" :class="{ current: currentCollegeStage === 'high'}" @click="changeCurrentCollegeStage('high')" @mouseenter="changeCurrentCollegeStage('high')">
                <img src="~/assets/images/badge/FEES_Logo.png" />
            </div>
            <div class="aurle-home-tag__badge" :class="{ current: currentCollegeStage === 'middle'}" @click="changeCurrentCollegeStage('middle')" @mouseenter="changeCurrentCollegeStage('middle')">
                <img src="~/assets/images/badge/FPM_Logo.png" />
            </div>
        </div>
        <div class="aurle-home-tag__info">
            <div class="aurle-home-tag__title">
                {{ currentCollegeInfo.info }}
            </div>
            <div class="aurle-home-tag__name">
                <span class="stage">{{ currentCollegeInfo.stage }}</span>
                {{ currentCollegeInfo.name }}
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
    @use '~/assets/styles/module/tags_global' as tags;
    
    .aurle-home-tag.college {
        display: flex;
        justify-content: center;
        flex-direction: column;
        gap: 0.25rem;
        padding: 0.5rem;
        min-width: 220px;

        .aurle-home-tag__school {
            display: flex;
            gap: 0.125rem;

            .aurle-home-tag__badge {
                opacity: 0.5;
                filter: saturate(0.25);
                transform: scale(0.9);
                transition: tags.$value-transition-duration;
                margin: 0 0.125rem;
                user-select: none;
                cursor: pointer;

                img {
                    display: block;
                    width: 32px;
                    height: 32px;
                    object-fit: cover;
                }

                &.current {
                    opacity: 1;
                    filter: saturate(1);
                    transform: scale(1);
                }
            }
        }

        .aurle-home-tag__info {
            display: flex;
            flex-direction: column;

            .aurle-home-tag__title {
                font-size: 18px;
                font-weight: 600;
            }

            .aurle-home-tag__name {
                color: var(--color-surface-4);
                font-size: 12px;

                .stage::after {
                    content: '·';
                    margin: 0 4px;
                }
            }
        }
    }
</style>