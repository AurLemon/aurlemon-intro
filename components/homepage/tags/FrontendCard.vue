<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const changeCardActive = (card: string) => {
    switch (card) {
        case 'frontend':
            isFrontendCardActive.value = !isFrontendCardActive.value
            break
        default:
            break
    }
}

const frontendCardInfo = ref<{
    [key in 'vue' | 'typescript' | 'flutter' | 'ui']: {
        title: string
        desc: string
    }
}>({
    'vue' : {
        title: 'Vue 好啊',
        desc: '用的最多，虽然 React 也有写过'
    },
    'typescript' :{
        title: 'TS 好啊',
        desc: '写多了就爽了，除非有时候真的懒得一个一个标类型'
    },
    'flutter' :{
        title: '就这个爽',
        desc: '其实只写过一个 Demo，放在这是因为过段时间就要做了呵呵。以前写过 Uniapp'
    },
    'ui' :{
        title: '可能看天赋',
        desc: '对美感要求比较高的东西还是算了，但 CSS 写的比较多所以提一嘴呵呵👍'
    }
})

const frontendCardBackgroundIcon = ref<'vue' | 'typescript' | 'flutter' | 'ui'>('vue')
const isFrontendCardActive = ref<boolean>(false)

const changeFrontendCardActiveShow = (info: string) => {
    switch (info) {
        case 'vue':
            frontendCardBackgroundIcon.value = 'vue'
            break
        case 'typescript':
            frontendCardBackgroundIcon.value = 'typescript'
            break
        case 'flutter':
            frontendCardBackgroundIcon.value = 'flutter'
            break
        case 'ui':
            frontendCardBackgroundIcon.value = 'ui'
            break
        default:
            break
    }
}

const currentFrontendActiveShow = computed(() => {
    const info = frontendCardInfo.value[frontendCardBackgroundIcon.value];
    return info ? info : { title: '不知道', desc: '不知道' };
})

onMounted(() => {
    const frontendOptions = ['vue', 'typescript', 'flutter', 'ui'] as const;
    frontendCardBackgroundIcon.value = frontendOptions[Math.floor(Math.random() * frontendOptions.length)];
})
</script>

<template>
    <div class="aurle-home-tag active-card frontend-dev" :class="{ active: isFrontendCardActive }"
        @click="changeCardActive('frontend')">
        <div class="aurle-home-tag__background">
            <div class="aurle-home-tag__icons">
                <div class="aurle-home-tag__icon" v-if="frontendCardBackgroundIcon === 'vue'">
                    <img src="~/assets/images/icons/Vue_Logo.svg" />
                </div>
                <div class="aurle-home-tag__icon" v-if="frontendCardBackgroundIcon === 'flutter'">
                    <fa :icon="['fab', 'flutter']" style="color: #74c0fc" />
                </div>
                <div class="aurle-home-tag__icon" v-if="frontendCardBackgroundIcon === 'typescript'">
                    <img src="~/assets/images/icons/TypeScript_Logo.svg" />
                </div>
                <div class="aurle-home-tag__icon" v-if="frontendCardBackgroundIcon === 'ui'">
                    <fa :icon="['fas', 'pen-nib']" style="color: #74c0fc" />
                </div>
            </div>
        </div>
        <div class="aurle-home-tag__foreground">
            <div class="aurle-home-tag__normal">
                <div class="aurle-home-tag__title">
                    Web<br />
                    <span class="emphasized">前端开发</span>
                </div>
                <div class="aurle-home-tag__tags">
                    <div class="aurle-home-tag__tag">Vue</div>
                    <div class="aurle-home-tag__tag">TypeScript</div>
                    <div class="aurle-home-tag__tag">Flutter</div>
                    <div class="aurle-home-tag__tag">UI/UX</div>
                </div>
            </div>
            <div class="aurle-home-tag__active">
                <div class="aurle-home-tag__title">
                    {{ currentFrontendActiveShow.title }}
                </div>
                <div class="aurle-home-tag__desc">
                    {{ currentFrontendActiveShow.desc }}
                </div>
                <div class="aurle-home-tag__tags">
                    <div class="aurle-home-tag__tag" :class="{ active: frontendCardBackgroundIcon === 'vue' }"
                        @click.stop="changeFrontendCardActiveShow('vue')">
                        Vue
                    </div>
                    <div class="aurle-home-tag__tag" :class="{ active: frontendCardBackgroundIcon === 'typescript' }"
                        @click.stop="changeFrontendCardActiveShow('typescript')">
                        TypeScript
                    </div>
                    <div class="aurle-home-tag__tag" :class="{ active: frontendCardBackgroundIcon === 'flutter' }"
                        @click.stop="changeFrontendCardActiveShow('flutter')">
                        Flutter
                    </div>
                    <div class="aurle-home-tag__tag" :class="{ active: frontendCardBackgroundIcon === 'ui' }"
                        @click.stop="changeFrontendCardActiveShow('ui')">
                        UI/UX
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
    @use '~/assets/styles/module/tags_global' as tags;
</style>