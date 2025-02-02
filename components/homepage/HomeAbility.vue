<template>
    <div class="aurle-home-ability">
        <div class="aurle-home-item school">
            <div class="aurle-home-item__background">
                <img v-if="currentStage === 0" src="~/assets/images/badge/FPM_Logo.png" />
                <img v-if="currentStage === 1" src="~/assets/images/badge/FEES_Logo.png" />
                <img v-if="currentStage === 2" src="~/assets/images/badge/FJCCC_Logo.png" />
                <div class="text" :style="{ color: `${collegeList[currentStage].color}66` }">{{ collegeList[currentStage].end_time }}</div>
            </div>
            <div class="aurle-home-item__foreground" :style="{ background: `linear-gradient(-45deg, ${collegeList[currentStage].color} -100%, transparent), radial-gradient(circle at top left, transparent 0% 8%, ${collegeList[currentStage].color}1a 8% 12%, transparent 12% 100%)` }">
                <div class="aurle-home-item__title">{{ collegeList[currentStage].comment }}</div>
                <div class="aurle-home-item__desc">
                    <div class="aurle-home-item__badge">
                        <img @click="changeCurrentCollegeStage(2)" @mouseenter="changeCurrentCollegeStage(2)" :class="{ active: currentStage === 2 }" src="~/assets/images/badge/FJCCC_Logo.png" />
                        <img @click="changeCurrentCollegeStage(1)" @mouseenter="changeCurrentCollegeStage(1)" :class="{ active: currentStage === 1 }" src="~/assets/images/badge/FEES_Logo.png" />
                        <img @click="changeCurrentCollegeStage(0)" @mouseenter="changeCurrentCollegeStage(0)" :class="{ active: currentStage === 0 }" src="~/assets/images/badge/FPM_Logo.png" />
                    </div>
                    <div class="aurle-home-item__type">{{ collegeList[currentStage].stage }}</div>
                </div>
                <div class="aurle-home-item__subtitle">
                    <div class="aurle-home-item__time">{{ collegeList[currentStage].start_time }} ~ {{ collegeList[currentStage].end_time }}</div>
                    <div class="aurle-home-item__school">
                        {{ collegeList[currentStage].name }}
                    </div>
                </div>
            </div>
        </div>
        <div class="aurle-home-wrapper">
            <div class="aurle-home-item project">
                <div class="aurle-home-item__background">
                    <div class="aurle-home-item__mask"></div>
                    <img src="~/assets/images/homepage/teps_background.webp" />
                </div>
                <div class="aurle-home-item__foreground">
                    <div class="aurle-home-item__title">转轨考刷题系统</div>
                    <div class="aurle-home-item__subtitle">原来那个太sb了。</div>
                    <div class="aurle-home-item__button">
                        <div class="aurle-home-item__link main">
                            <a href="https://fjcpc-teps.aurlemon.top/" target="_blank" rel="noopener noreferrer">查看部署</a>
                        </div>
                        <div class="aurle-home-item__link github">
                            <a href="https://github.com/AurLemon/fjcpc-transfer-exam-practice-system" target="_blank" rel="noopener noreferrer">
                                <fa :icon="['fab', 'github']" />
                            </a>
                        </div>
                        <div class="aurle-home-item__link bilibili">
                            <a href="https://www.bilibili.com/video/BV1Fjm6Y3EJ2" target="_blank" rel="noopener noreferrer">
                                <fa :icon="['fab', 'bilibili']" />
                            </a>
                        </div>
                    </div>
                </div>
            </div>
            <div class="aurle-home-item plan">
                <div class="aurle-home-item__background">
                    <div class="aurle-home-item__mask"></div>
                    <div class="material-icons">schedule</div>
                </div>
                <div class="aurle-home-item__foreground">
                    <div class="aurle-home-item__title">最近比较忙</div>
                    <div class="aurle-home-item__subtitle">要准备CET4和蓝桥杯。</div>
                    <div class="aurle-home-item__button">
                        <div class="aurle-home-item__link main">
                            <a href="https://plan.aurlemon.top/" target="_blank" rel="noopener noreferrer">我的计划</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="aurle-home-item s-card profession">
            <div class="aurle-home-item__background">
                <fa :icon="['fas', 'microchip']" />
            </div>
            <div class="aurle-home-item__foreground">
                <div class="aurle-home-item__title">计科类</div>
                <div class="aurle-home-item__subtitle">我觉得还可以。</div>
            </div>
        </div>
        <div class="aurle-home-item s-card self-position">
            <div class="aurle-home-item__background">
                <fa :icon="['fab', 'node']" />
            </div>
            <div class="aurle-home-item__foreground">
                <div class="aurle-home-item__title">全栈开发</div>
                <div class="aurle-home-item__subtitle">样样不精通。</div>
            </div>
        </div>
        <div class="aurle-home-item s-card education">
            <div class="aurle-home-item__background">
                <fa :icon="['fab', 'docker']" />
            </div>
            <div class="aurle-home-item__foreground">
                <div class="aurle-home-item__title">小站站长</div>
                <div class="aurle-home-item__subtitle">域名全备案。</div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const currentStage = ref(2)

const collegeList = ref<{
    id: number,
    comment: string,
    stage: string,
    name: string,
    start_time: string,
    end_time: string,
    color: string
}[]>([
    {
        id: 0,
        comment: '非常好学校非常好老师',
        stage: '初中',
        name: '福州屏东中学',
        start_time: '2018',
        end_time: '2021',
        color: '#ee9a51'
    },
    {
        id: 1,
        comment: '过得舒服爱干嘛干嘛',
        stage: '中职 (3+2)',
        name: '福建工贸学校',
        start_time: '2021',
        end_time: '2024',
        color: '#59b7b5'
    },
    {
        id: 2,
        comment: '臭大专屁事还多',
        stage: '高职 (3+2)',
        name: '福建船政交通职业学院',
        start_time: '2024',
        end_time: '2026',
        color: '#5283be'
    }
])

const changeCurrentCollegeStage = (stage: number) => {
    currentStage.value = stage
}

const planList = ref<{
    name: string,
    time: string,
    score?: string,
    is_finished: boolean,
    is_passed?: boolean
}[]>([
    {
        name: '计算机一级',
        time: '2021-12-04',
        score: '60',
        is_finished: true,
        is_passed: true
    },
    {
        name: '计算机二级',
        time: '2021-12-04',
        score: '60',
        is_finished: true,
        is_passed: true
    },
    {
        name: 'JLPT N2',
        time: '2023-07-02',
        score: '69',
        is_finished: true,
        is_passed: false
    },
    {
        name: 'CET 4',
        time: '2025-06',
        is_finished: false
    },
    {
        name: '蓝桥杯初赛',
        time: '2025-04',
        is_finished: false
    },
    {
        name: '省统招专升本',
        time: '2026-03',
        is_finished: false
    }
])
</script>

<style scoped lang="scss">
    @use '~/assets/styles/media_screen.scss' as media;
    
    .aurle-home-ability {
        display: grid;
        gap: 0.5rem;
        grid-template-columns: repeat(3, 1fr);

        .aurle-home-item {
            background: var(--background-light-4);
            backdrop-filter: blur(32px) saturate(1.25);
            border-radius: 8px;
            outline: 1.75px solid transparent;
            box-shadow: 0 0 64px var(--border-color-base);
            position: relative;
            min-height: 64px;
            transition: 250ms;

            .aurle-home-item__background {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 4;
                user-select: none;
            }

            .aurle-home-item__foreground {
                position: relative;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 5;
                height: 100%;
                transition: 250ms;
            }

            &.school {
                grid-column: span 3;
                padding: 0;
                border: 1px solid var(--border-color-base--darker);
                overflow: hidden;

                .aurle-home-item__background {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    flex-direction: column;
                    padding-right: 0.5rem;

                    img {
                        $image-length: 60px;
                        display: block;
                        width: $image-length;
                        height: $image-length;
                        transform: scale(1.5);
                        opacity: 0.2;
                        box-shadow: 0 4px 8px #ffffff;
                    }

                    .text {
                        font-size: 32px;
                        font-weight: bold;
                        font-family: "MiSans Latin";
                        text-shadow: 0 0 16px var(--border-color-base--darker);
                        opacity: 0.3;
                        transform: scale(1.25) translateY(3px);
                        transform-origin: top;
                    }
                }

                .aurle-home-item__foreground {
                    padding: 0.75rem 1.25rem;

                    .aurle-home-item__title {
                        display: flex;
                        align-items: center;
                        color: var(--color-text);
                        font-size: 28px;
                        font-weight: 600;
                    }

                    .aurle-home-item__desc {
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        color: var(--color-text--subtle);
                        font-size: 13px;
                        margin-top: 0.25rem;
                        margin-bottom: 0.125rem;

                        .aurle-home-item__badge {
                            display: flex;
                            gap: 0.25rem;

                            img {
                                $image-length: 16px;
                                display: block;
                                width: $image-length;
                                height: $image-length;
                                object-fit: cover;
                                border-radius: 50%;
                                box-shadow: 0 0 256px var(--color-primary);
                                opacity: 0.3;
                                transition: 200ms;
                                cursor: pointer;

                                &.active {
                                    opacity: 1;
                                }
                            }
                        }
                    }

                    .aurle-home-item__subtitle {
                        display: flex;
                        gap: 0.75rem;
                        font-size: 14px;

                        .aurle-home-item__time {
                            color: var(--color-surface-4);

                            &::after {
                                content: ">";
                                line-height: 1;
                                margin-left: 0.5rem;
                            }
                        }

                        .aurle-home-item__school {
                            display: flex;
                            align-items: center;
                            gap: 0.25rem;
                        }
                    }                   
                }
            }

            &.s-card {
                $image-length: 50px;
                overflow: hidden;

                .aurle-home-item__background {
                    display: flex;
                    align-items: flex-end;

                    img, svg, span {
                        display: block;
                        margin-left: auto;
                        margin-right: 0.375rem;
                        width: $image-length;
                        font-size: $image-length;
                        height: 100%;
                        object-fit: contain;
                    }

                    span {
                        color: var(--color-text--subtle);
                        display: block;
                        height: fit-content;
                        margin-top: auto;
                        margin-bottom: auto;
                    }
                }

                .aurle-home-item__foreground {
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    padding: 0.75rem 0.5rem;
                    padding-right: $image-length * 0.75;
                    background: linear-gradient(-45deg, rgba(185, 230, 253, 0.25), transparent 70%),
                                radial-gradient(circle at bottom left, transparent 0% 10%, rgba(184, 213, 225, 0.1) 10% 20%, transparent 20% 100%);

                    .aurle-home-item__title {
                        font-size: 18px;
                        font-weight: 600;
                    }

                    .aurle-home-item__subtitle {
                        color: var(--color-text--subtle);
                        font-size: 12px;
                    }
                }
            }

            &.location {
                .aurle-home-item__background {
                    img, svg {
                        object-position: bottom;
                    }
                }

                .aurle-home-item__foreground {
                    background: linear-gradient(-45deg, rgba(190, 225, 187, 0.25), transparent 70%),
                                radial-gradient(circle at bottom left, transparent 0% 10%, rgba(196, 225, 184, 0.1) 10% 20%, transparent 20% 100%);
                }
            }

            &.education {
                .aurle-home-item__foreground {
                    background: linear-gradient(-45deg, rgba(156, 183, 221, 0.25), transparent 70%),
                                radial-gradient(circle at bottom left, transparent 0% 10%, rgba(184, 196, 225, 0.1) 10% 20%, transparent 20% 100%);
                }
            }

            &.project {
                overflow: hidden;

                .aurle-home-item__background {
                    .aurle-home-item__mask {
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        z-index: 4;
                        mask-image: linear-gradient(to right, #fff 20%, transparent 95%);
                        backdrop-filter: blur(8px) saturate(1.5);

                        &::before {
                            content: '';
                            position: absolute;
                            top: 0;
                            left: 0;
                            right: 0;
                            bottom: 0;
                            background: rgba(2, 164, 239, 0.2);
                        }
                    }

                    img {
                        display: block;
                        width: 100%;
                        height: 100%;
                        object-fit: contain;
                        object-position: right top;
                        position: relative;
                        z-index: 1;
                    }
                }

                .aurle-home-item__foreground {
                    padding: 0.5rem 0.75rem;
                    background: radial-gradient(circle at bottom left, transparent 0% 10%, rgba(53, 141, 177, 0.1) 10% 20%, transparent 20% 100%);

                    .aurle-home-item__title {
                        font-size: 18px;
                        font-weight: 600;
                    }

                    .aurle-home-item__subtitle {
                        font-size: 12px;
                    }

                    .aurle-home-item__button {
                        display: flex;
                        align-items: center;
                        margin-top: 0.25rem;

                        .aurle-home-item__link {
                            &.main {
                                margin-right: 0.25rem;

                                a {
                                    display: block;
                                    color: #fff;
                                    font-size: 12px;
                                    padding: 0.125rem 0.5rem;
                                    background: var(--color-primary);
                                    border-radius: 24px;
                                    transition: 250ms;
                                }

                                &:hover {
                                    a {
                                        color: var(--color-primary);
                                        background: var(--color-surface-0);
                                    }
                                }

                                &:active {
                                    a {
                                        transform: scale(0.96);
                                    }
                                }
                            }

                            a {
                                display: block;
                            }

                            img, svg {
                                $image-length: 16px;
                                color: var(--color-text--subtle);
                                display: block;
                                width: $image-length;
                                height: $image-length;
                                border-radius: 50%;
                                object-fit: cover;
                                padding: 0.25rem;
                                transition: 250ms;

                                &:hover {
                                    transform: scale(1.02);
                                    background: var(--background-dark-0);
                                }

                                &:active {
                                    transform: scale(0.95);
                                }
                            }
                        }
                    }
                }
            }

            &.plan {
                overflow: hidden;

                .aurle-home-item__background {
                    display: flex;
                    justify-content: right;

                    .aurle-home-item__mask {
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        z-index: 4;
                        mask-image: linear-gradient(to right, #fff 20%, transparent 125%);
                        backdrop-filter: blur(8px) saturate(1.5);

                        &::before {
                            content: '';
                            position: absolute;
                            top: 0;
                            left: 0;
                            right: 0;
                            bottom: 0;
                            background: rgba(2, 13, 239, 0.07);
                        }
                    }

                    .material-icons {
                        font-size: 4rem;
                        margin-top: auto;
                    }
                }

                .aurle-home-item__foreground {
                    padding: 0.5rem 0.75rem;
                    background: radial-gradient(circle at bottom left, transparent 0% 10%, rgba(53, 141, 177, 0.1) 10% 20%, transparent 20% 100%);

                    .aurle-home-item__title {
                        font-size: 18px;
                        font-weight: 600;
                    }

                    .aurle-home-item__subtitle {
                        font-size: 12px;
                    }

                    .aurle-home-item__button {
                        display: flex;
                        align-items: center;
                        margin-top: 0.25rem;

                        .aurle-home-item__link {
                            &.main {
                                margin-right: 0.25rem;

                                a {
                                    display: block;
                                    color: #fff;
                                    font-size: 12px;
                                    padding: 0.125rem 0.5rem;
                                    background: var(--color-primary);
                                    border-radius: 24px;
                                    transition: 250ms;
                                }

                                &:hover {
                                    a {
                                        color: var(--color-primary);
                                        background: var(--color-surface-0);
                                    }
                                }

                                &:active {
                                    a {
                                        transform: scale(0.96);
                                    }
                                }
                            }

                            a {
                                display: block;
                            }

                            img, svg {
                                $image-length: 16px;
                                color: var(--color-text--subtle);
                                display: block;
                                width: $image-length;
                                height: $image-length;
                                border-radius: 50%;
                                object-fit: cover;
                                padding: 0.25rem;
                                transition: 250ms;

                                &:hover {
                                    transform: scale(1.02);
                                    background: var(--background-dark-0);
                                }

                                &:active {
                                    transform: scale(0.95);
                                }
                            }
                        }
                    }
                }
            }

            &:hover {
                outline-color: var(--color-primary);
            }
        }

        .aurle-home-wrapper {
            grid-column: span 3;
            display: flex;
            gap: inherit;

            .aurle-home-item {
                flex: 1;
            }
        }
    }
</style>