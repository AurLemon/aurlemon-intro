<script setup lang="ts">
import { ref } from 'vue'
import dayjs from 'dayjs'
import { birthdate, atbeeExamDate } from '../utils/time.ts'

interface UserTag {
    id: number
    label: string
    color?: string
}

const infoTags = ref<UserTag[]>()

const calculateBirthdate = (): string => {
    const birthday = dayjs(birthdate)
    return dayjs().diff(birthday, 'year')
}
</script>

<template>
    <div class="aurle-home aurle-page">
        <div class="aurle-home-me">
            <div class="aurle-home-me__avatar">
                <img src="../assets/images/AurLemon_Avatar.jpg" alt="">
            </div>
            <div class="aurle-home-me__name">
                <div class="aurle-home-me__info">
                    <div class="aurle-home-me__username">AurLemon</div>
                    <div class="aurle-home-me__id">@AurLemon</div>
                </div>
                <div class="aurle-home-me__nick">
                    <div class="nick">柠檬</div>
                    <div class="simply-tag">{{ calculateBirthdate() }}</div>
                    <div class="simply-tag">{{ dayjs().isAfter(dayjs('2026-06-30')) ? '臭二本的' : '臭大专的' }}</div>
                    <div class="simply-tag">INFJ/TJ</div>
                    <div class="simply-tag">福州</div>
                </div>
            </div>
        </div>
        <div class="aurle-home-basic">
            <div class="aurle-home-desc">CS / Web 全栈 / 嵌入式入门ing</div>
            <div class="aurle-home-contact-list">
                <div class="aurle-home-contact github">
                    <a href="https://github.com/AurLemon" target="_blank">
                        <img src="../assets/images/GitHub_Logo.svg" alt="GitHub 账户">
                    </a>
                </div>
                <div class="aurle-home-contact bilibili">
                    <a href="https://space.bilibili.com/204271518" target="_blank">
                        <img src="../assets/images/bilibili_Logo.svg" alt="B 站账户">
                    </a>
                </div>
                <div class="aurle-home-contact cnblogs">
                    <a href="https://cnblogs.com/AurLemon" target="_blank">
                        <img src="../assets/images/cnblogs_Logo.svg" alt="博客园博客">
                    </a>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
    .aurle-home {
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;

        .aurle-home-me {
            display: flex;
            align-items: center;
            gap: 1rem;

            .aurle-home-me__avatar img {
                $value-image-length: 88px;
                width: $value-image-length;
                height: $value-image-length;
                border-radius: 50%;
                border: 2px solid #ffca0c;
            }

            .aurle-home-me__name {
                display: flex;
                flex-direction: column;
                gap: 0.25rem;

                .aurle-home-me__info {
                    display: flex;
                    align-items: baseline;
                    gap: 0.75rem;
                }

                .aurle-home-me__username {
                    color: var(--color-text--emphasized);
                    font-size: 64px;
                    font-weight: 600;
                    font-family: 'Caveat';
                    line-height: 1;
                }

                .aurle-home-me__nick {
                    color: var(--color-text--subtle);
                    font-size: 14px;
                    display: flex;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 0.375rem;

                    .nick {
                        line-height: 1;
                    }

                    .simply-tag {
                        color: var(--color-text);
                        font-size: 10px;
                        padding: 2px 6px;
                        border-radius: 8px;
                        background: var(--background-color-primary--active);
                    }
                }

                .aurle-home-me__id {
                    color: var(--color-surface-4);
                    font-size: 16px;
                }
            }
        }

        .aurle-home-basic {
            display: flex;
            align-items: center;
            flex-direction: column;
            gap: 0.25rem;
            padding: 2px 16px;
            margin-top: 4rem;

            .aurle-home-desc {
                color: var(--color-text);
                font-size: 12px;
                font-weight: 600;
                padding: 0 8px;
            }

            .aurle-home-contact-list {
                display: flex;
                align-items: center;
                gap: 0.25rem;

                .aurle-home-contact {
                    padding: 0.25rem;
                    border-radius: 9999px;
                    transition: 150ms;
                    user-select: none;
                    cursor: pointer;

                    a {
                        display: flex;
                    }

                    img {
                        $value-image-length: 18px;
                        width: $value-image-length;
                        height: $value-image-length;
                    }

                    &:hover {
                        background: var(--border-color-base);
                    }

                    &:active {
                        transform: scale(0.9);
                    }
                }
            }
        }
    }
</style>