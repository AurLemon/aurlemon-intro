<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { SkinViewer } from 'skinview3d'

const SKIN_API = 'https://minotar.net/skin/'

const skinCanvas = ref<HTMLCanvasElement>()

onMounted(() => {
    if (skinCanvas.value) {
        const aurLemonSkin = new SkinViewer({
            canvas: skinCanvas.value,
            skin: SKIN_API + 'Aurora_Lemon',
            width: 110,
            height: 180
        })

        aurLemonSkin.fov = 60
        aurLemonSkin.zoom = 1
        aurLemonSkin.autoRotate = true
    }
})
</script>

<template>
    <div class="aurle-home-tag long skin-show">
        <div class="aurle-home-tag__background">
            <canvas ref="skinCanvas"></canvas>
        </div>
        <div class="aurle-home-tag__foreground">
            <div class="aurle-home-tag__nick">柠檬</div>
            <div class="aurle-home-tag__id">Aurora_Lemon</div>
        </div>
    </div>
</template>

<style scoped lang="scss">
    @use '~/assets/styles/module/tags_global' as tags;
    @use '~/assets/styles/media_screen.scss' as media;

    .aurle-home-tag.skin-show {
        $value-skin-show-width: 110px;
        min-width: $value-skin-show-width;
        height: 100%;

        .aurle-home-tag__background {
            display: flex;
            justify-content: flex-end;
            z-index: 2;
            pointer-events: none;

            canvas {
                width: $value-skin-show-width !important;
                height: 100% !important;
                object-fit: cover;
                filter: drop-shadow(0 0 8px var(--background-dark-0));
                transform: rotate(-30deg) translate(20px, 25px);
                transition: tags.$value-transition-duration;
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

        &:hover {
            .aurle-home-tag__background {
                canvas {
                    transform: rotate(-25deg) translate(20px, 20px);
                }
            }
        }
    }
</style>