<script setup lang="ts">
import { ref, onMounted } from 'vue'

const ANIME_INTERVAL: number = 3000

const animeInfo = ref<{
    id: number
    title: string
    image: string
    tooltip: string
}[]>([
    {
        id: 1,
        title: '#GIRLS BAND CRY',
        image: '/assets/images/homepage/anime-card/GBC.webp',
        tooltip: '这就是我们gbc啊你们有没有这样的gbc，另外关注芸草冰谢谢'
    },
    {
        id: 2,
        title: '#IT\'S MY GO!!!',
        image: '/assets/images/homepage/anime-card/MYGO.webp',
        tooltip: '我们go批是这样的。。。。'
    },
    {
        id: 3,
        title: '#败犬女主太多了',
        image: '/assets/images/homepage/anime-card/Make.webp',
        tooltip: '我鞠伟大无需多言'
    }
])

const animeInfoIndex = ref<number>(0)
let animeInterval: any; // 这里用 any 是因为 TS 不支持直接声明一个 Interval 变量

const nextAnime = () => animeInfoIndex.value = (animeInfoIndex.value + 1) % animeInfo.value.length

const startAnimeInterval = () => {
    animeInterval = setInterval(() => {
        nextAnime()
    }, ANIME_INTERVAL)
}

const stopAnimeInterval = () => clearInterval(animeInterval)

onMounted(() => {
    startAnimeInterval()
})
</script>

<template>
    <div class="aurle-home-tag anime" v-tooltip.bottom="{ content: animeInfo[animeInfoIndex].tooltip ?? '我喜欢你' }"
        :style="{ '--anime-card-offset': animeInfoIndex }" @mouseenter="stopAnimeInterval" @mouseleave="startAnimeInterval" @click="nextAnime">
        <div class="aurle-home-tag__wrapper" v-for="(anime, index) in animeInfo" :key="anime.id" :anime-id="anime.id"
            :style="{ '--anime-card-index': index }" :class="{ current: index === animeInfoIndex }">
            <div class="aurle-home-tag__background">
                <img :src="anime.image" />
            </div>
            <div class="aurle-home-tag__foreground">
                <div class="aurle-home-tag__title">{{ anime.title }}</div>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
    @use '~/assets/styles/module/tags_global' as tags;
    @use '~/assets/styles/media_screen.scss' as media;

    .aurle-home-tag.anime {
        --anime-card-index: 0;
        --anime-card-offset: 0;

        .aurle-home-tag__wrapper {
            position: absolute;
            top: 0;
            left: calc(var(--anime-card-index) * 100% + var(--anime-card-offset) * -100%);
            right: calc(var(--anime-card-index) * -100% + var(--anime-card-offset) * -100%);
            bottom: 0;
            width: 100%;
            height: 100%;
            transition: 500ms;
            overflow: hidden;

            &.current {
                z-index: 10;
            }

            .aurle-home-tag__background {
                img {
                    display: block;
                    width: 100%;
                    object-fit: cover;
                    object-position: top;
                    transform: translate(0, -10%);
                    transition: tags.$value-transition-duration;
                }
            }

            .aurle-home-tag__foreground {
                display: flex;
                justify-content: flex-end;
                flex-direction: column;
                padding: 0.5rem;
                background: linear-gradient(35deg, var(--background-dark-2) -50%, transparent 40%);

                .aurle-home-tag__title {
                    color: var(--color-surface-0);
                    font-size: 14px;
                    font-weight: 600;
                    text-shadow: 0 0 3px var(--background-dark-2);

                    @include media.media-screen(mobile) {
                        font-size: 18px;
                    }
                }
            }

            &:hover {
                .aurle-home-tag__background {
                    img {
                        filter: saturate(1.5);
                        transform: translate(20%, 5%) scale(1.5);
                    }
                }
            }

            @include media.media-screen(mobile) {
                .aurle-home-tag__background {
                    img {
                        height: 100%;
                        transform: translate(0, 0);
                    }
                }
            }
        }
    }
</style>