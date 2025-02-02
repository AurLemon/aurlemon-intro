<template>
    <div class="aurle-home-tag mi-fans" v-tooltip.top="{ content: '就买就买，怎么了，你们有没有这样的手机啊解 BL 要高考' }">
        <div class="aurle-home-tag__image">
            <MiLogo />
        </div>
        <div class="aurle-home-tag__info">
            <div class="aurle-home-tag__title">我是米猴</div>
        </div>
    </div>
</template>

<script setup lang="ts">
import MiLogo from '~/assets/images/icons/Xiaomi_Logo.svg'
</script>

<style scoped lang="scss">
    @use '~/assets/styles/module/tags_global' as tags;

    .aurle-home-tag.mi-fans {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 0.325rem;
        padding: 0.5rem;

        .aurle-home-tag__info {
            display: flex;
            flex-direction: column;
            gap: 0.75px;
        }

        .aurle-home-tag__image {
            img, svg {
                $value-mi-logo-width: 32px;
                display: block;
                width: $value-mi-logo-width;
                height: $value-mi-logo-width;
                filter: saturate(0.85);
                transform: scale(0.9) rotate(0deg);
                transition: tags.$value-transition-duration, transform 600ms;
                user-select: none;
            }
        }

        .aurle-home-tag__title {
            color: var(--color-text);
            font-size: 18px;
            font-weight: 600;
        }

        &:hover {
            .aurle-home-tag__image {
                img, svg {
                    filter: saturate(1.5);
                    transform: scale(1) rotate(360deg);
                }
            }
        }
    }
</style>