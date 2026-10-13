<template>
	<div
		:class="{ 'is-dismissed': dismissed }"
		class="card-navigation absolute left-1/2 -top-[3px] z-4 flex max-w-full -translate-x-1/2 -translate-y-1/2"
	>
		<UButton
			:to="localePath(to)"
			:tabindex="dismissed ? -1 : undefined"
			color="neutral"
			variant="soft"
			class="card-navigation-surface group/hint relative max-w-full shrink-0 gap-1.5 overflow-hidden rounded-full bg-transparent px-3 py-1.25 text-xs font-normal text-slate-500 shadow-none hover:bg-transparent hover:text-slate-500 focus-visible:ring-2 focus-visible:ring-slate-400 dark:bg-transparent dark:text-slate-400 dark:hover:bg-transparent dark:hover:text-slate-400"
		>
			<span
				class="card-navigation-shell pointer-events-none absolute inset-0 rounded-full border-2 border-[color-mix(in_srgb,var(--color-slate-400)_60%,var(--color-slate-200))] bg-(--color-surface-0) group-hover/hint:bg-(--color-surface-1) group-focus-visible/hint:bg-(--color-surface-1) dark:border-[color-mix(in_srgb,var(--color-slate-700)_80%,var(--color-slate-800))] dark:bg-(--color-surface-1) dark:group-hover/hint:bg-(--color-surface-2) dark:group-focus-visible/hint:bg-(--color-surface-2)"
				aria-hidden="true"
			/>
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
					<span class="px-0.5 font-bold text-slate-800 dark:text-slate-100">{{
						pageLabel
					}}</span>
				</template>
			</i18n-t>
		</UButton>
	</div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'

interface Props {
	hovered: boolean
	to: string
	labelKey: string
	pageLabel: string
}

const props = defineProps<Props>()
const localePath = useLocalePath()
const dismissed = ref(false)
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
/* 常驻 DOM：外壳、箭头、文字分层进入，不在每次 hover 时重新挂载。 */
.card-navigation {
	pointer-events: none;
}

.card-navigation-surface {
	opacity: 0;
	clip-path: inset(17.5% 41% round 999px);
	transition:
		opacity 650ms ease,
		clip-path 800ms cubic-bezier(0.22, 1, 0.36, 1);
}

/* 只缩放装饰外壳，文字不跟随缩放；不测量或逐帧修改宽高。 */
.card-navigation-shell {
	transform: scale(0.18, 0.65);
	transform-origin: center;
	transition:
		transform 800ms cubic-bezier(0.22, 1, 0.36, 1),
		background-color 180ms ease;
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
	.group\/card:hover
		.card-navigation:not(.is-dismissed)
		.card-navigation-surface
),
:global(
	.group\/card:focus-within
		.card-navigation:not(.is-dismissed)
		.card-navigation-surface
) {
	opacity: 1;
	clip-path: inset(0% 0% round 999px);
	transition-duration: 360ms, 800ms;
	transition-delay: 0ms, 100ms;
}

:global(
	.group\/card:hover .card-navigation:not(.is-dismissed) .card-navigation-shell
),
:global(
	.group\/card:focus-within
		.card-navigation:not(.is-dismissed)
		.card-navigation-shell
) {
	transform: none;
	transition-delay: 100ms, 0ms;
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
