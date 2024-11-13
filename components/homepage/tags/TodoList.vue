<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const todoListIndex = ref<number>(0)

const todoList = ref<{
    name: string
}[]>([
    {
        name: '蓝桥杯'
    },
    {
        name: '睡觉'
    },
    {
        name: 'CET 4'
    },
    {
        name: 'JLPT'
    }
])

const generateTodoListIndex = () => {
    todoListIndex.value = (todoListIndex.value + 1) % todoList.value.length
}

onMounted(() => {
    generateTodoListIndex()
})
</script>

<template>
    <div class="aurle-home-tag todo-list">
        <div class="aurle-home-tag__background">
            <span class="material-icons">checklist</span>
        </div>
        <div class="aurle-home-tag__foreground">
            <div class="aurle-home-tag__refresh material-icons" @click="generateTodoListIndex">refresh</div>
            <div class="aurle-home-tag__subtitle">最近在做</div>
            <div class="aurle-home-tag__title">{{ todoList[todoListIndex].name }}</div>
        </div>
    </div>
</template>

<style scoped lang="scss">
    @use '~/assets/styles/module/tags_global' as tags;

    .aurle-home-tag.todo-list {
        min-width: 100px;

        .aurle-home-tag__background {
            display: flex;
            justify-content: flex-end;
            pointer-events: none;
            z-index: 2;

            .material-icons {
                font-size: 54px;
                opacity: 0.2;
                filter: saturate(0.75);
                width: fit-content;
                height: fit-content;
                transform: translate(10px, -10px) rotate(-25deg);
                transition: tags.$value-transition-duration;
                pointer-events: none;
                user-select: none;
            }
        }

        .aurle-home-tag__foreground {
            justify-content: flex-end;

            .aurle-home-tag__refresh {
                color: var(--color-surface-4);
                font-size: 14px;
                padding: 3px;
                width: fit-content;
                margin-bottom: auto;
                border-radius: 50%;
                transition: tags.$value-transition-duration;
                user-select: none;
                cursor: pointer;
                pointer-events: all;

                &:hover {
                    background: var(--border-color-base);
                }

                &:active {
                    transform: scale(0.8);
                    transition-duration: 80ms;
                }
            }

            .aurle-home-tag__subtitle {
                color: var(--color-text--subtle);
                font-size: 12px;
            }

            .aurle-home-tag__title {
                color: var(--color-text);
                font-size: 18px;
                font-weight: 600;
                margin-top: 0;
                height: 24px;
            }
        }

        &:hover {
            .aurle-home-tag__background {
                .material-icons {
                    color: var(--color-primary);
                    opacity: 1;
                    filter: saturate(0.9) drop-shadow(0 0 8px var(--background-dark-0));
                    transform: translate(10px, -10px) rotate(0deg) scale(0.5);
                }
            }
        }
    }
</style>