<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { SkinViewer } from 'skinview3d'

const SKIN_API = 'https://minotar.net/skin/'

const skinCanvas = ref<HTMLCanvasElement>()

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
        stage: '中专 (3+2)',
        name: "福建工贸学校",
        info: '给我爽了三年'
    },
    college: {
        stage: '大专 (3+2)',
        name: "福建船政交通职业学院",
        info: '臭大专屁事还多'
    }
})

const todoListIndex = ref<number>(0)
const todoList = ref<{
    name: string
}[]>([
    {
        name: '蓝桥杯'
    },
    {
        name: 'Sleep'
    }
])

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
});

const generateTodoListIndex = () => {
    todoListIndex.value = (todoListIndex.value + 1) % todoList.value.length
}

onMounted(() => {
    if (skinCanvas.value) {
        const aurLemonSkin = new SkinViewer({
            canvas: skinCanvas.value,
            skin: SKIN_API + 'Aurora_Lemon',
            width: 100,
            height: 120
        })

        aurLemonSkin.fov = 60
        aurLemonSkin.zoom = 1
        aurLemonSkin.autoRotate = true
    }

    generateTodoListIndex()
})
</script>

<template>
    <div class="aurle-home-tags">
        <div class="aurle-home-tag small computer-science">
            <div class="aurle-home-tag__background">
                <div class="aurle-home-tag__icons">
                    <fa class="aurle-home-tag__icon" :icon="['fas', 'code']" />                            
                </div>
            </div>
            <div class="aurle-home-tag__foreground">
                <div class="aurle-home-tag__title">
                    计算机<br>
                    <span class="emphasized">科学与技术</span>
                </div>
            </div>
        </div>
        <div class="aurle-home-tag small web-fullstack">
            <div class="aurle-home-tag__background">
                <div class="aurle-home-tag__icons">
                    <fa class="aurle-home-tag__icon" :icon="['fab', 'node']" />                            
                    <fa class="aurle-home-tag__icon" :icon="['fab', 'vuejs']" />                            
                </div>
            </div>
            <div class="aurle-home-tag__foreground">
                <div class="aurle-home-tag__title">
                    Web<br>
                    <span class="emphasized">全栈开发</span>
                </div>
            </div>
        </div>
        <div class="aurle-home-tag small ui-design">
            <div class="aurle-home-tag__background">
                <div class="aurle-home-tag__icons">
                    <fa class="aurle-home-tag__icon" :icon="['fas', 'pen-nib']" />
                </div>
            </div>
            <div class="aurle-home-tag__foreground">
                <div class="aurle-home-tag__title">
                    <span class="emphasized">UI / 排版</span>
                </div>
            </div>
        </div>
        <div class="aurle-home-tag small small-long embedded-development">
            <div class="aurle-home-tag__background">
                <div class="aurle-home-tag__icons">                         
                    <fa class="aurle-home-tag__icon" :icon="['fas', 'microchip']" />                            
                </div>
            </div>
            <div class="aurle-home-tag__foreground">
                <div class="aurle-home-tag__title">
                    运维与<br>
                    <span class="emphasized">嵌入式</span>
                </div>
            </div>
        </div>
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
        <div class="aurle-home-tag long-stick my-blog">
            <a href="https://cnblogs.com/AurLemon" target="_blank">
                <span class="material-icons">call_missed_outgoing</span>
                可以顺带来我博客看看🤤
            </a>
        </div>
        <div class="aurle-home-tag follow-me">建议关注我🤤🤤</div>
        <div class="aurle-home-tag minecraft">
            <div class="aurle-home-tag__title">
                Build & BedWars<br>
                <span class="emphasized">Minecraft</span>
            </div>
            <div class="aurle-home-tag__axe">
                <img src="~/assets/images/icons/Wooden_Axe.png" alt="">
            </div>
        </div>
        <div class="aurle-home-tag long skin-show">
            <div class="aurle-home-tag__background">
                <canvas ref="skinCanvas"></canvas>
            </div>
            <div class="aurle-home-tag__foreground">
                <div class="aurle-home-tag__nick">柠檬</div>
                <div class="aurle-home-tag__id">Aurora_Lemon</div>
            </div>
        </div>
        <div class="aurle-home-tag transportation">
            <div class="aurle-home-tag__normal">
                <span class="material-icons">train</span>
            </div>
            <div class="aurle-home-tag__hover">
                <span class="text">交通</span>
            </div>
        </div>
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
                    {{ currentCollegeInfo.info ?? '不知道'}}
                </div>
                <div class="aurle-home-tag__name">
                    <span class="stage">{{ currentCollegeInfo.stage ?? '未知'}}</span>
                    {{ currentCollegeInfo.name ?? '不知道'}}
                </div>
            </div>
        </div>
        <div class="aurle-home-tag personality">
            <div class="aurle-home-tag__background">
                <div class="emoji">😋</div>
            </div>
            <div class="aurle-home-tag__foreground">
                <div class="aurle-home-tag__subtitle">抽象神经发电</div>
                <div class="aurle-home-tag__title">喜不喜欢</div>
            </div>
        </div>
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
    </div>
</template>

<style scoped lang="scss">
    $value-transition-duration: 350ms;

    .aurle-home-tags {
        display: grid;
        grid-template-rows: repeat(4, auto);
        grid-auto-flow: column;
        grid-gap: 0.5rem;
        font-size: 14px;

        .aurle-home-tag {
            grid-row: span 2;
            font-size: 12px;
            border: 1px solid var(--border-color-base);
            outline: 2px solid transparent;
            border-radius: 12px;
            background: #fff;
            box-shadow: 0 0 128px var(--border-color-base);
            position: relative;
            overflow: hidden;
            transition: $value-transition-duration;

            .aurle-home-tag__background {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 0;
            }

            .aurle-home-tag__foreground {
                display: flex;
                flex-direction: column;
                height: 100%;
                padding: 0.5rem;
                position: relative;
                z-index: 1;
            }

            .aurle-home-tag__title {
                color: var(--color-text--subtle);
                text-align: left;
                width: 100%;
                margin-top: auto;

                .emphasized {
                    color: var(--color-text);
                    font-size: 18px;
                    font-weight: 600;
                }
            }

            &.small {
                min-height: 80px;

                .aurle-home-tag__background {
                    display: flex;
                    justify-content: flex-end;
                    
                    .aurle-home-tag__icons {
                        display: flex;
                        gap: 0.125rem;
                        color: hsl(var(--color-primary__h), var(--color-primary__s), 75%);
                        width: fit-content;
                        height: fit-content;
                        filter: drop-shadow(0px 2px 24px rgba(11, 189, 159, 0.145));
                        transform: perspective(40px) rotateX(25deg) rotateY(-20deg) translate(-5%, 35%) scale(1.25);
                        transition: $value-transition-duration;

                        svg {
                            display: block;
                            height: 24px;
                        }
                    }
                }
            }

            &.ui-design {
                grid-row: span 1;
                min-height: unset;

                .aurle-home-tag__background {
                    .aurle-home-tag__icons {
                        transform: scale(1.25) translate(-5px, 5px);

                        svg {
                            height: 14px;
                        }
                    }
                }

                &:hover {
                    .aurle-home-tag__background {
                        .aurle-home-tag__icons {
                            transform: scale(1.25) translate(-8px, 6px);
                        }
                    }
                }
            }

            &.small-long {
                height: unset;
                grid-row: span 4;

                .aurle-home-tag__icons {
                    transform: perspective(50px) rotateX(25deg) rotateY(-20deg) translate(-45%, 45%) scale(1.75) !important;
                }

                &:hover {
                    .aurle-home-tag__icons {
                        transform: perspective(50px) rotateX(25deg) rotateY(-20deg) translate(-65%, 60%) scale(1.75) !important;
                    }
                }
            }

            &.embedded-development {
                grid-row: span 3;
            }

            &.long-stick {
                grid-column: span 3;
                grid-row: span 1;
                border-color: var(--background-color-primary--active);
                outline: none;

                a {
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                    color: var(--color-text--subtle);
                    height: 100%;
                    padding: 0.125rem 1rem;
                    background: var(--background-color-primary--hover);
                    transition: $value-transition-duration;

                    .material-icons {
                        font-size: 16px;
                    }

                    &:hover {
                        background: var(--background-color-primary--active);
                    }
                }
            }

            &.project-show {
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                grid-column: span 5;
                grid-row: span 3;
                padding: 0.5rem;
            }

            &.follow-me {
                grid-column: span 2;
                grid-row: 4;
                display: flex;
                align-items: center;
                gap: 0.25rem;
                color: var(--color-surface-0);
                height: 100%;
                border: 1px solid var(--background-color-overlay);
                padding: 0.125rem 1rem;
                background: var(--color-primary);
                transition: $value-transition-duration;
            }

            &.transportation {
                display: flex;
                flex-direction: column;
                grid-column: span 1;
                grid-row: span 1;
                min-width: 32px;
                min-height: 32px;
                user-select: none;
                cursor: pointer;

                .aurle-home-tag__normal, .aurle-home-tag__hover {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                }

                .aurle-home-tag__normal {
                    .material-icons {
                        color: var(--color-text--subtle);
                        font-size: 18px;
                    }
                }

                .aurle-home-tag__hover {
                    top: 100%;
                    bottom: -100%;
                    font-size: 12px;
                    color: var(--color-surface-0);
                    font-weight: 600;
                    background: var(--color-primary);
                    transition: $value-transition-duration;
                }

                &:hover {
                    .aurle-home-tag__hover {
                        top: 0%;
                        bottom: 0%;
                    }
                }
            }

            &.college {
                display: flex;
                flex-direction: column;
                gap: 0.25rem;
                grid-column: span 5;
                grid-row: 3 / span 2;
                padding: 0.5rem;
                min-width: 220px;

                .aurle-home-tag__school {
                    display: flex;
                    gap: 0.125rem;

                    .aurle-home-tag__badge {
                        opacity: 0.5;
                        filter: saturate(0.25);
                        transform: scale(0.75);
                        transition: $value-transition-duration;
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

            &.minecraft {
                grid-column: span 2;
                grid-row: span 1;
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 0.25rem;
                padding: 0.5rem;

                .aurle-home-tag__axe {
                    img {
                        display: block;
                        width: 2rem;
                        height: 2rem;
                        transition: $value-transition-duration;
                    }
                }

                .aurle-home-tag__title {
                    margin-top: 0;
                }

                &:hover {
                    .aurle-home-tag__axe {
                        img {
                            filter: brightness(1.5) drop-shadow(0px 0px 6px rgba(191, 158, 92, 0.4));
                        }
                    }
                }
            }

            &.skin-show {
                $value-skin-show-width: 110px;
                grid-row: span 3;
                min-width: $value-skin-show-width;
                height: 100%;

                .aurle-home-tag__background {
                    z-index: 2;
                    pointer-events: none;

                    canvas {
                        width: $value-skin-show-width !important;
                        height: 100% !important;
                        object-fit: cover;
                        filter: drop-shadow(0 0 8px var(--background-dark-0));
                        transform: rotate(-30deg) translate(20px, 25px);
                        transition: $value-transition-duration;
                    }
                }

                .aurle-home-tag__foreground {
                    justify-content: flex-end;

                    .aurle-home-tag__nick {
                        color: var(--color-text);
                        font-size: 18px;
                        font-weight: 600;
                    }

                    .aurle-home-tag__id {
                        color: var(--color-text--subtle);
                        font-family: 'Minecraft';
                    }
                }
            }

            &.personality {
                grid-column: span 2;
                grid-row: span 2;

                .aurle-home-tag__background {
                    display: flex;
                    justify-content: flex-end;
                    z-index: 2;

                    .emoji {
                        font-size: 54px;
                        opacity: 0.2;
                        filter: saturate(0.75);
                        width: fit-content;
                        height: fit-content;
                        transform: translate(20px, -20px) rotate(-25deg);
                        transition: $value-transition-duration;
                        pointer-events: none;
                        user-select: none;
                    }
                }

                .aurle-home-tag__foreground {
                    justify-content: flex-end;

                    .aurle-home-tag__subtitle {
                        color: var(--color-text--subtle);
                        font-size: 12px;
                    }

                    .aurle-home-tag__title {
                        color: var(--color-text);
                        font-size: 18px;
                        font-weight: 600;
                        margin-top: 0;
                    }
                }

                &:hover {
                    .aurle-home-tag__background {
                        .emoji {
                            opacity: 1;
                            filter: saturate(0.9) drop-shadow(0 0 8px var(--background-dark-0));
                            transform: translate(18px, -18px) rotate(25deg);
                        }
                    }
                }
            }

            &.todo-list {
                grid-column: span 2;
                grid-row: span 2;
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
                        transition: $value-transition-duration;
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
                        transition: $value-transition-duration;
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
                            opacity: 1;
                            filter: saturate(0.9) drop-shadow(0 0 8px var(--background-dark-0));
                        }
                    }
                }
            }

            &:hover {
                outline-color: var(--color-primary);

                &.small {
                    .aurle-home-tag__icons {
                        transform: perspective(60px) rotateX(25deg) rotateY(-20deg) translate(-25%, 35%) scale(1.35);
                    }
                }
            }
        }
    }
</style>