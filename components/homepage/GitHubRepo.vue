<template>
    <div class="aurle-github-repo">
        <div class="aurle-github-repo-list">
            <div class="aurle-github-repo-item" v-for="repo in repositories" :key="repo.id"
                v-tooltip="{ content: repo.description }">
                <a :href="repo.html_url" target="_blank" rel="noopener noreferrer">
                    <div class="aurle-github-repo-item__title">
                        <span class="aurle-github-repo-item__color"
                            :style="{ backgroundColor: getLanguageColor(repo.language) }"></span>
                        {{ repo.name }}
                    </div>
                    <div class="aurle-github-repo-item__wrapper">
                        <div class="aurle-github-repo-item__info">
                            <div class="aurle-github-repo-item__data aurle-github-repo-item__language"
                                v-if="repo.language">
                                {{ repo.language }}
                            </div>
                            <div class="aurle-github-repo-item__data aurle-github-repo-item__star"
                                v-if="repo.stargazers_count">
                                {{ repo.stargazers_count }}
                            </div>
                            <div class="aurle-github-repo-item__data aurle-github-repo-item__fork"
                                v-if="repo.forks_count">
                                {{ repo.forks_count }}
                            </div>
                        </div>
                    </div>
                </a>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import languageColorsData from '~/assets/utils/language_color.json'
import type { Config } from '~/assets/utils/language_color.d'

const languageColors = languageColorsData as unknown as Config // 我觉得是可信的👍

const GITHUB_USER_NAME = 'AurLemon'

interface Repository {
    id: number
    name: string
    html_url: string
    description: string | null
    language: string | null
    license: { name: string } | null
    stargazers_count: number
    forks_count: number
}

const repositories = ref<Repository[]>([])

const fetchRepositories = async () => {
    try {
        const response = await fetch('/api/github?user=AurLemon')
        if (!response.ok) {
            throw new Error('Failed to fetch repositories')
        }

        const data = await response.json()
        repositories.value = data.sort(
            (a: Repository, b: Repository) => b.stargazers_count - a.stargazers_count
        )
    } catch (error) {
        console.error('Error fetching repositories:', error)
    }
}

const getLanguageColor = (language: string | null): string => {
    return language && languageColors[language]?.color ? languageColors[language].color : 'var(--color-primary)'
}

onMounted(() => {
    fetchRepositories()
})
</script>

<style scoped lang="scss">
@use '~/assets/styles/media_screen.scss' as media;

.aurle-github-repo {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;

    .aurle-github-repo-list {
        display: flex;
        gap: 0.25rem;
        width: 670px;
        overflow-x: auto;

        @include media.media-screen(phone) {
            width: 100%;
        }

        .aurle-github-repo-item {
            flex: 0 0 220px;

            a {
                color: var(--color-text);
                height: 100%;
                display: flex;
                flex-direction: column;
                gap: 0.125rem;
                border: 1px solid var(--border-color-base);
                padding: 0.5rem;
                border-radius: 8px;
                transition: 150ms;
                cursor: pointer;

                &:hover {
                    background: var(--border-color-base);
                }
            }
        }

        .aurle-github-repo-item__wrapper {
            display: flex;
        }

        .aurle-github-repo-item__title {
            display: -webkit-box;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            font-size: 14px;
            font-weight: 600;

            .aurle-github-repo-item__color {
                flex: 0 0 8px;
                display: inline-block;
                width: 8px;
                height: 8px;
                margin-right: 0.125rem;
                border-radius: 50%;
            }
        }

        .aurle-github-repo-item__desc {
            color: var(--color-text--subtle);
            font-size: 13px;
            display: -webkit-box;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 1;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .aurle-github-repo-item__info {
            color: var(--color-text--weaken);
            font-size: 12px;
            display: flex;
            gap: 0.75rem;
            margin-top: auto;

            .aurle-github-repo-item__data {
                display: flex;
                align-items: center;
                gap: 0.125rem;

                &::before {
                    display: block;
                    font-family: "Material Icons";
                    font-size: 16px;
                }

                &.aurle-github-repo-item__language::before {
                    content: 'code';
                }

                &.aurle-github-repo-item__star::before {
                    content: 'star';
                }

                &.aurle-github-repo-item__fork::before {
                    content: 'fork_right';
                }
            }
        }
    }
}
</style>