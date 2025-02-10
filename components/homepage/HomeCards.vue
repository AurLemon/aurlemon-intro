<template>
    <div class="page-home-cards">
        <div class="page-home-card basic" :class="{ show: homeCardStore.basicCard }">
            <div class="page-home-card__title">可以点一下关注吗</div>
            <HomeBasic />
        </div>
        <div class="page-home-card ability" :class="{ show: homeCardStore.abilityCard }">
            <div class="page-home-card__title">等我26年考出去</div>
            <HomeAbility />
        </div>
        <div class="page-home-card interest" :class="{ show: homeCardStore.interestCard }">
            <div class="page-home-card__title">每天都困想睡觉怎么办</div>
            <HomeInterest />
        </div>
    </div>
</template>

<script setup lang="ts">
import { useHomeCard } from '~/stores/homeCard'

import HomeBasic from './HomeBasic.vue'
import HomeAbility from './HomeAbility.vue' 
import HomeInterest from './HomeInterest.vue'

const homeCardStore = useHomeCard()
</script>

<style scoped lang="scss">
    @use '~/assets/styles/media_screen.scss' as media;

    $card-transition-duration: 400ms;

    .page-home-cards {
        width: 100%;
        height: 100%;

        .page-home-card {
            margin: 2rem;
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            opacity: 0;
            user-select: none;
            pointer-events: none;
            transition: $card-transition-duration;
            transform: translateY(-20%) scale(0.5);
            filter: drop-shadow(0 0 12px var(--border-color-base));
            overflow-y: auto;

            &.show {
                opacity: 1;
                user-select: auto;
                pointer-events: all;
                transform: translateY(0) scale(1);
                overflow-y: auto;

                @include media.media-screen(phone) {
                    mask: linear-gradient(to top, transparent 1rem, #fff 8rem);
                }
            }
            
            .page-home-card__title {
                font-size: 28px;
                font-weight: 600;
                text-align: center;
                margin-bottom: 1rem;
            }

            @include media.media-screen(mobile) {
                padding: 1rem;
                padding-bottom: 10rem;
                margin: 0;
            }
        }
    }
</style>