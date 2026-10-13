<template>
	<div
		:class="{ 'is-dismissed': dismissed }"
		class="card-navigation absolute left-1/2 -top-[3px] z-4 flex max-w-full -translate-x-1/2 -translate-y-1/2"
	>
		<div v-motion="revealMotion">
			<UButton
				:to="localePath(to)"
				:tabindex="dismissed ? -1 : undefined"
				color="neutral"
				variant="soft"
				class="card-navigation-surface group/hint relative max-w-full shrink-0 gap-0 rounded-full bg-transparent p-0 text-xs font-normal text-slate-500 shadow-none hover:bg-transparent hover:text-slate-500 focus-visible:ring-2 focus-visible:ring-slate-400 dark:bg-transparent dark:text-slate-400 dark:hover:bg-transparent dark:hover:text-slate-400"
			>
				<span
					v-motion="shellMotion"
					class="card-navigation-shell pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[color-mix(in_srgb,var(--color-slate-400)_60%,var(--color-slate-200))] bg-(--color-surface-0) group-hover/hint:bg-(--color-surface-1) group-focus-visible/hint:bg-(--color-surface-1) dark:border-[color-mix(in_srgb,var(--color-slate-700)_80%,var(--color-slate-800))] dark:bg-(--color-surface-1) dark:group-hover/hint:bg-(--color-surface-2) dark:group-focus-visible/hint:bg-(--color-surface-2)"
					aria-hidden="true"
				/>
				<span
					v-motion="contentMotion"
					class="card-navigation-content relative flex items-center gap-1.5 overflow-hidden rounded-full px-3 py-1.25"
				>
					<span
						class="card-navigation-arrow relative flex size-3.5 shrink-0 items-center justify-center text-slate-700 dark:text-slate-100"
						aria-hidden="true"
					>
						<svg
							viewBox="0 0 20 20"
							fill="none"
							class="card-navigation-nudge size-3.5"
						>
							<path
								class="card-navigation-stroke"
								pathLength="1"
								d="M4 10h12m-5-5 5 5-5 5"
								stroke="currentColor"
								stroke-width="1.6"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					</span>
					<i18n-t
						:keypath="labelKey"
						tag="span"
						scope="global"
						class="card-navigation-label relative min-w-0 whitespace-nowrap text-left leading-4"
					>
						<template #page>
							<span
								class="px-0.5 font-bold text-slate-800 dark:text-slate-100"
								>{{ pageLabel }}</span
							>
						</template>
					</i18n-t>
				</span>
			</UButton>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useReducedMotion, vMotion, type Options } from 'motion-v'

interface Props {
	hovered: boolean
	focused: boolean
	to: string
	labelKey: string
	pageLabel: string
}

const props = defineProps<Props>()
const localePath = useLocalePath()
const { isMobileMotion } = useDisplayMode()
const dismissed = ref(false)
const reducedMotion = useReducedMotion()
const visible = computed(
	() =>
		!dismissed.value &&
		((!isMobileMotion.value && props.hovered) || props.focused),
)

const revealMotion = computed<Options>(() => ({
	initial: {
		opacity: 0,
		y: reducedMotion.value || isMobileMotion.value ? 0 : -2,
		filter:
			reducedMotion.value || isMobileMotion.value ? 'blur(0px)' : 'blur(4px)',
	},
	animate: {
		opacity: visible.value ? 1 : 0,
		y: visible.value || reducedMotion.value || isMobileMotion.value ? 0 : -2,
		filter:
			visible.value || reducedMotion.value || isMobileMotion.value
				? 'blur(0px)'
				: 'blur(4px)',
	},
	transition:
		reducedMotion.value || isMobileMotion.value
			? { duration: 0 }
			: visible.value
				? {
						type: 'spring',
						stiffness: 230,
						damping: 12,
						mass: 0.7,
						opacity: { duration: 0.38, delay: 0.12, ease: 'easeOut' },
						filter: { duration: 0.5, delay: 0.12, ease: 'easeOut' },
					}
				: {
						type: 'tween',
						duration: 0.32,
						ease: 'easeOut',
						y: { duration: 0, delay: 0.32 },
						filter: { duration: 0, delay: 0.32 },
					},
}))

const shapeTransition = computed<Options['transition']>(() =>
	reducedMotion.value || isMobileMotion.value
		? { duration: 0 }
		: visible.value
			? { type: 'spring', stiffness: 180, damping: 20, mass: 0.9 }
			: { type: 'tween', duration: 0.8, ease: 'easeInOut' },
)
const shellMotion = computed<Options>(() => ({
	initial: { width: '18%', height: '65%' },
	animate: {
		width: visible.value ? '100%' : '18%',
		height: visible.value ? '100%' : '65%',
	},
	transition: shapeTransition.value,
}))
const contentMotion = computed<Options>(() => ({
	initial: { clipPath: 'inset(17.5% 41% round 999px)' },
	animate: {
		clipPath: visible.value
			? 'inset(0% 0% round 999px)'
			: 'inset(17.5% 41% round 999px)',
	},
	transition: shapeTransition.value,
}))
let hideTimer: ReturnType<typeof setTimeout> | undefined

const clearHideTimer = () => {
	if (hideTimer !== undefined) clearTimeout(hideTimer)
	hideTimer = undefined
}

watch(
	() => props.hovered,
	(hovered) => {
		clearHideTimer()
		dismissed.value = false
		if (!hovered) return
		hideTimer = setTimeout(() => {
			dismissed.value = true
			hideTimer = undefined
		}, 4000)
	},
	{ immediate: true },
)

onBeforeUnmount(clearHideTimer)
</script>

<style scoped>
@media (width < 64rem) {
	.card-navigation {
		display: none;
	}
}

/* 常驻 DOM：外壳、箭头、文字分层进入，不在每次 hover 时重新挂载。 */
.card-navigation {
	pointer-events: none;
}

/* Motion V 同步外壳与内容裁切；真实宽高保留边框与圆角。 */
.card-navigation-shell {
	transition: background-color 180ms ease;
}

.card-navigation-arrow,
.card-navigation-label {
	opacity: 0;
	transition: opacity 380ms ease;
}

:global(.group\/card:hover .card-navigation:not(.is-dismissed)),
:global(.group\/card:focus-within .card-navigation:not(.is-dismissed)) {
	pointer-events: auto;
}

:global(
	.group\/card:hover .card-navigation:not(.is-dismissed) .card-navigation-arrow
),
:global(
	.group\/card:focus-within
		.card-navigation:not(.is-dismissed)
		.card-navigation-arrow
) {
	opacity: 1;
	transform: none;
	transition-delay: 300ms;
}

:global(
	.group\/card:hover .card-navigation:not(.is-dismissed) .card-navigation-label
),
:global(
	.group\/card:focus-within
		.card-navigation:not(.is-dismissed)
		.card-navigation-label
) {
	opacity: 1;
	transform: none;
	transition-delay: 360ms;
}

.card-navigation-nudge {
	animation: card-arrow-nudge 1400ms ease-in-out 820ms infinite;
	animation-play-state: paused;
}

:global(
	.group\/card:hover .card-navigation:not(.is-dismissed) .card-navigation-nudge
),
:global(
	.group\/card:focus-within
		.card-navigation:not(.is-dismissed)
		.card-navigation-nudge
) {
	animation-play-state: running;
}

@keyframes card-arrow-nudge {
	0%,
	100% {
		transform: translateX(-0.5px);
	}
	50% {
		transform: translateX(0.5px);
	}
}

.card-navigation-stroke {
	stroke-dasharray: 1;
	stroke-dashoffset: 1;
	transition: stroke-dashoffset 520ms ease;
}

:global(
	.group\/card:hover .card-navigation:not(.is-dismissed) .card-navigation-stroke
),
:global(
	.group\/card:focus-within
		.card-navigation:not(.is-dismissed)
		.card-navigation-stroke
) {
	stroke-dashoffset: 0;
	transition-delay: 300ms;
}

/* 透明入口保留键盘可达性，聚焦后由所属卡片展开。 */
.card-navigation:not(.is-dismissed):focus-within {
	pointer-events: auto;
}

@media (prefers-reduced-motion: reduce) {
	.card-navigation,
	.card-navigation-surface,
	.card-navigation-shell,
	.card-navigation-content,
	.card-navigation-arrow,
	.card-navigation-label,
	.card-navigation-stroke {
		transition: none;
		transform: none;
	}
	.card-navigation-nudge {
		animation: none;
		transform: none;
	}
	.card-navigation-stroke {
		stroke-dashoffset: 0;
	}
}
</style>
