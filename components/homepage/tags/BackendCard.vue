<script setup lang="ts">
import { ref, computed, onMounted } from "vue";

const changeCardActive = (card: string) => {
    switch (card) {
        case 'backend':
            isBackendCardActive.value = !isBackendCardActive.value
            break
        default:
            break
    }
}

const backendCardInfo = ref<{
    [key in 'nest' | 'spring' | 'cache' | 'sql']: {
        title: string
        desc: string
    }
}>({
    'nest' : {
        title: '像 Spring',
        desc: '写 Nest 的时候学到了很多，后面发现原来 Spring 就是这个样'
    },
    'spring' :{
        title: '刚开始。',
        desc: '在用 Spring 写一个小 Demo，给朋友用的嘻嘻'
    },
    'cache' :{
        title: '只能说用过。',
        desc: '维护 MW 的时候接触到了 Redis 和 MemCached，后面打算引入 Redis 放自己项目试试'
    },
    'sql' :{
        title: '比较无感',
        desc: 'MySQL 和 PGSQL 用过，emm 其实小项目感觉用啥都没差主要还是业务逻辑'
    }
})

const backendCardBackgroundIcon = ref<'nest' | 'spring' | 'cache' | 'sql'>('nest')
const isBackendCardActive = ref<boolean>(false)

const changeBackendCardActiveShow = (info: string) => {
    switch (info) {
        case 'nest':
            backendCardBackgroundIcon.value = 'nest'
            break
        case 'spring':
            backendCardBackgroundIcon.value = 'spring'
            break
        case 'cache':
            backendCardBackgroundIcon.value = 'cache'
            break
        case 'sql':
            backendCardBackgroundIcon.value = 'sql'
            break
        default:
            break
    }
}

const currentBackendActiveShow = computed(() => {
    const info = backendCardInfo.value[backendCardBackgroundIcon.value];
    return info ? info : { title: '不知道', desc: '不知道' };
})

onMounted(() => {
    const backendOptions = ['nest', 'spring', 'cache', 'sql'] as const
    backendCardBackgroundIcon.value = backendOptions[Math.floor(Math.random() * backendOptions.length)]
});
</script>

<template>
    <div class="aurle-home-tag active-card backend-dev" :class="{ active: isBackendCardActive }"
        @click="changeCardActive('backend')">
        <div class="aurle-home-tag__background">
            <div class="aurle-home-tag__icons">
                <div class="aurle-home-tag__icon" v-if="backendCardBackgroundIcon === 'nest'">
                    <img src="~/assets/images/icons/Nest_Logo.svg" />
                </div>
                <div class="aurle-home-tag__icon" v-if="backendCardBackgroundIcon === 'spring'">
                    <img src="~/assets/images/icons/Spring_Logo.svg" />
                </div>
                <div class="aurle-home-tag__icon" v-if="backendCardBackgroundIcon === 'cache'">
                    <img src="~/assets/images/icons/Redis_Logo.svg" />
                </div>
                <div class="aurle-home-tag__icon" v-if="backendCardBackgroundIcon === 'sql'">
                    <fa :icon="['fas', 'database']" style="color: #74c0fc" />
                </div>
            </div>
        </div>
        <div class="aurle-home-tag__foreground">
            <div class="aurle-home-tag__normal">
                <div class="aurle-home-tag__title">
                    Web<br />
                    <span class="emphasized">后端开发</span>
                </div>
                <div class="aurle-home-tag__tags">
                    <div class="aurle-home-tag__tag">Nest</div>
                    <div class="aurle-home-tag__tag">Spring</div>
                    <div class="aurle-home-tag__tag">缓存</div>
                    <div class="aurle-home-tag__tag">SQL</div>
                </div>
            </div>
            <div class="aurle-home-tag__active">
                <div class="aurle-home-tag__title">
                    {{ currentBackendActiveShow.title }}
                </div>
                <div class="aurle-home-tag__desc">
                    {{ currentBackendActiveShow.desc }}
                </div>
                <div class="aurle-home-tag__tags">
                    <div class="aurle-home-tag__tag" :class="{ active: backendCardBackgroundIcon === 'nest' }"
                        @click.stop="changeBackendCardActiveShow('nest')">
                        Nest
                    </div>
                    <div class="aurle-home-tag__tag" :class="{ active: backendCardBackgroundIcon === 'spring' }"
                        @click.stop="changeBackendCardActiveShow('spring')">
                        Spring
                    </div>
                    <div class="aurle-home-tag__tag" :class="{ active: backendCardBackgroundIcon === 'cache' }"
                        @click.stop="changeBackendCardActiveShow('cache')">
                        缓存
                    </div>
                    <div class="aurle-home-tag__tag" :class="{ active: backendCardBackgroundIcon === 'sql' }"
                        @click.stop="changeBackendCardActiveShow('sql')">
                        SQL
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
    @use '~/assets/styles/module/tags_global' as tags;
</style>
