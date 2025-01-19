<template>
    <header class="aurle-page-header">
        <div class="aurle-page-header-list" ref="headerList" @click="handleHeaderClick">
            <div class="aurle-page-header-pointer"
                :style="{ background: `radial-gradient(100px circle at ${pointerX}px ${pointerY}px, var(--background-color-primary--active) 0%, transparent 65%)` }">
            </div>
            <div class="aurle-page-header-avatar">
                <img src="~/assets/images/AurLemon_Avatar.jpg" />
            </div>
            <div class="aurle-page-header-link">
                <div class="aurle-page-header-item">
                    <NuxtLink to="/">首页</NuxtLink>
                </div>
                <div class="aurle-page-header-item">
                    <NuxtLink to="/desc">自述</NuxtLink>
                </div>
                <div class="aurle-page-header-item">
                    <NuxtLink to="/profile">成分</NuxtLink>
                </div>
                <div class="aurle-page-header-item">
                    <NuxtLink to="/project">项目</NuxtLink>
                </div>
                <div class="aurle-page-header-item">
                    <NuxtLink to="/more">更多</NuxtLink>
                </div>
            </div>
        </div>
        <div class="aurle-page-header-panel" @click="infoPanel.togglePanel">
            <div class="material-icons">keyboard_arrow_down</div>
        </div>
    </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { gsap } from 'gsap'
import { useInfoPanel } from '~/stores/infoPanel'

const infoPanel = useInfoPanel()
const headerList = ref<HTMLElement | null>(null)

const targetX = ref(0)
const targetY = ref(0)

const pointerX = ref(0)
const pointerY = ref(0)

const offsetX = ref(0)
const offsetY = ref(12)

const lastScrollProgress = ref(0)
const scrollProgress = ref(0)
const throttleTimer = ref<number | ReturnType<typeof setTimeout> | null>(null) 

const updateTargetPosition = (event: MouseEvent) => {
    if (!headerList.value) return

    const x = event.clientX
    const y = event.clientY

    targetX.value = x - offsetX.value
    targetY.value = y - offsetY.value
}

const calculateOffset = () => {
    if (headerList.value) {
        const rect = headerList.value.getBoundingClientRect()
        offsetX.value = rect.left
    }
}

const smoothUpdate = () => {
    const easeFactor = 0.2
    pointerX.value += (targetX.value - pointerX.value) * easeFactor
    pointerY.value += (targetY.value - pointerY.value) * easeFactor

    requestAnimationFrame(smoothUpdate)
}

const handleHeaderClick = () => {
    if (!headerList.value) return

    gsap.to(headerList.value, {
        y: 6,
        duration: 0.2,
        ease: 'power2.out',
        onComplete: () => {
            gsap.to(headerList.value, {
                y: -4,
                duration: 0.15,
                ease: 'back.out(1.7)',
                onComplete: () => {
                    gsap.to(headerList.value, {
                        y: 0,
                        duration: 0.15,
                        ease: 'power2.inOut',
                    })
                }
            })
        }
    })
}

const updateScrollProgress = () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop
    const docHeight = document.documentElement.scrollHeight
    const winHeight = window.innerHeight
    
    const progress = (scrollTop / (docHeight - winHeight)) * 100
    scrollProgress.value = Math.min(Math.max(progress, 0), 100)
}

const scrollbarAnimation = () => {
    if (!headerList.value) return;
    
    const progressDiff = scrollProgress.value - lastScrollProgress.value
    const mappedMin = 0
    const mappedMax = 10
    const mappedBounceY = (Math.abs(progressDiff) + 100) * (mappedMax - mappedMin) / 200 + mappedMin // 线性变换
    let bounceY = Math.min(mappedBounceY, 50)
    bounceY = progressDiff < 0 ? bounceY : -bounceY // 上滑和下滑的动画是相反的
    lastScrollProgress.value = scrollProgress.value
    
    gsap.to(headerList.value, {
        y: bounceY,
        duration: bounceY < 0 ? 0.15 : 0.2,
        ease: 'power2.out',
        onComplete: () => {
            gsap.to(headerList.value, {
                y: -bounceY * 0.75,
                duration: bounceY < 0 ? 0.2 : 0.15,
                ease: 'back.out(1.25)',
                onComplete: () => {
                    gsap.to(headerList.value, {
                        y: 0,
                        duration: 0.2,
                        ease: 'power2.inOut',
                    })
                }
            })
        }
    })
}

const throttleScroll = () => {
    if (!throttleTimer.value) {
        throttleTimer.value = setTimeout(() => {
            scrollbarAnimation()
            throttleTimer.value = null
        }, 300)
    }
}

const handleScroll = () => {
    updateScrollProgress()
    throttleScroll()
}

onMounted(() => {
    nextTick(() => calculateOffset())
    window.addEventListener('resize', calculateOffset)
    document.addEventListener('mousemove', updateTargetPosition)
    window.addEventListener('scroll', handleScroll)
    smoothUpdate()
})

onUnmounted(() => {
    window.removeEventListener('resize', calculateOffset)
    document.removeEventListener('mousemove', updateTargetPosition)
    window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped lang="scss">
    @use '~/assets/styles/media_screen.scss' as media;

    .aurle-page-header {
        position: fixed;
        top: 0.75rem;
        left: 50%;
        transform: translateX(-50%);
        z-index: 99999;
        height: 4rem;

        .aurle-page-header-list {
            display: flex;
            align-items: center;
            padding: 0 0.5rem;
            background: var(--background-light-3);
            border: 1px solid var(--border-color-base);
            border-radius: 32px;
            backdrop-filter: blur(32px) saturate(1.5);
            box-shadow: 0 32px 48px var(--border-color-base);
            overflow: hidden;
            transition: 300ms;
            user-select: none;

            .aurle-page-header-pointer {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                opacity: 0.75;
                filter: blur(16px);
            }

            .aurle-page-header-avatar {
                position: relative;
                z-index: 100000;
                margin: auto 0.375rem;

                img {
                    $image-length: 24px;
                    display: block;
                    width: $image-length;
                    height: $image-length;
                    border: 0.5px solid #B7D9EB;
                    border-radius: 50%;
                }
            }

            .aurle-page-header-link {
                display: flex;
                align-items: center;
                gap: 1.75rem;
                margin: 0 1.25rem;
            }

            .aurle-page-header-item {
                $item-transition-duration: 250ms ease-in-out;
                position: relative;
                z-index: 100000;

                a {
                    display: block;
                    padding: 0.5rem 0;
                    color: var(--color-text);
                    font-size: 14px;
                    line-height: normal;
                    transition: $item-transition-duration;
                    word-break: keep-all;

                    &::after {
                        $offset-position: 0.125rem;
                        content: '';
                        position: absolute;
                        left: 50%;
                        bottom: -0.5px;
                        background: linear-gradient(to right, transparent 5%, var(--color-primary) 50%, transparent 95%);
                        width: 2.25rem;
                        height: $offset-position;
                        transform: translateX(-50%) translateY(4px);
                        transition: $item-transition-duration;
                    }

                    &.router-link-active {
                        color: var(--color-primary);
                        font-weight: 600;

                        &::after {
                            width: 2.75rem;
                            transform: translateX(-50%) translateY(0);
                        }
                    }

                    &:hover {
                        color: var(--color-primary);

                        
                    }
                }
            }
        }

        @keyframes float {
            from, to {
                transform: translate(-50%, 0);
            }

            50% {
                transform: translate(-50%, 3px);
            }
        }

        .aurle-page-header-panel {
            width: fit-content;
            left: 50%;
            position: relative;
            margin-top: 0.125rem;
            animation: float 2s ease infinite;

            .material-icons {
                color: var(--color-surface-4);
                font-size: 20px;
                user-select: none;
                cursor: pointer;
                padding: 0.125rem;
                border-radius: 50%;
                transition: 150ms;

                &:hover {
                    background: var(--background-dark-0);
                }
            }
        }
    }
</style>