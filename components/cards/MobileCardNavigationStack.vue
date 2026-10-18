<template>
	<Teleport to="[data-mobile-card-navigation]">
		<div
			v-if="isCompact"
			class="pointer-events-none relative flex justify-center"
			:class="{ 'mobile-card-hints-fast': fastScrolling }"
		>
			<TransitionGroup name="mobile-card-hint">
				<NuxtLink
					v-for="(hint, index) in hints"
					:key="hint.id"
					:to="localePath(hint.to)"
					:tabindex="index === 0 ? undefined : -1"
					:aria-hidden="index > 0 ? true : undefined"
					class="mobile-card-hint absolute top-0 flex w-72 max-w-full items-center justify-center gap-1.5 rounded-full border-2 border-slate-300 px-3 py-[5px] text-xs leading-4 font-normal text-slate-500 dark:border-slate-700 dark:text-slate-400"
					:class="
						index === 0
							? 'pointer-events-auto bg-(--color-surface-0) shadow-md shadow-slate-950/10 dark:bg-(--color-surface-1) dark:shadow-black/25'
							: 'pointer-events-none bg-(--color-surface-1) shadow-sm shadow-slate-950/10 dark:bg-(--color-surface-2) dark:shadow-black/25'
					"
					:style="{ '--hint-index': index, zIndex: 3 - index }"
				>
					<svg
						viewBox="0 0 20 20"
						fill="none"
						class="size-3.5 shrink-0 text-slate-700 dark:text-slate-100"
						aria-hidden="true"
					>
						<path
							d="M4 10h12m-5-5 5 5-5 5"
							stroke="currentColor"
							stroke-width="1.6"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
					<i18n-t
						:keypath="hint.labelKey"
						tag="span"
						scope="global"
						class="min-w-0 text-center"
					>
						<template #page>
							<span
								class="px-0.5 font-bold text-slate-800 dark:text-slate-100"
								>{{ $t(hint.pageKey) }}</span
							>
						</template>
					</i18n-t>
				</NuxtLink>
			</TransitionGroup>
		</div>
	</Teleport>
</template>

<script setup lang="ts">
import type { MobileNavigationHint } from '~/composables/useMobileCardNavigationStack'
interface Props {
	container: HTMLElement | null
}
const props = defineProps<Props>()
const { isCompact } = useDisplayMode()
const localePath = useLocalePath()
const definitions: MobileNavigationHint[] = [
	{
		id: 'profile',
		to: '/profile',
		labelKey: 'main.index.card.navigation.profile',
		pageKey: 'main.index.card.navigation.pages.profile',
	},
	{
		id: 'project',
		to: '/project',
		labelKey: 'main.index.card.navigation.project',
		pageKey: 'main.index.card.navigation.pages.project',
	},
	{
		id: 'acg',
		to: '/preference',
		labelKey: 'main.index.card.navigation.acg',
		pageKey: 'main.index.card.navigation.pages.preference',
	},
	{
		id: 'music',
		to: '/preference',
		labelKey: 'main.index.card.navigation.music',
		pageKey: 'main.index.card.navigation.pages.preference',
	},
]
const { hints, fastScrolling } = useMobileCardNavigationStack(
	toRef(props, 'container'),
	isCompact,
	definitions,
)
</script>

<style scoped>
.mobile-card-hint {
	transform: translateY(calc(var(--hint-index) * 8px))
		scale(calc(1 - var(--hint-index) * 0.05));
	transform-origin: top center;
	filter: blur(0);
	transition:
		transform 280ms cubic-bezier(0.22, 1, 0.36, 1),
		opacity 240ms ease-out,
		filter 440ms ease-out;
}
.mobile-card-hint-enter-active {
	transition:
		transform 600ms cubic-bezier(0.22, 1.35, 0.36, 1),
		opacity 240ms ease-out,
		filter 440ms cubic-bezier(0.25, 0.46, 0.45, 0.94) 40ms;
}
.mobile-card-hint-enter-from {
	opacity: 0;
	filter: blur(5px);
	transform: translateY(calc(var(--hint-index) * 8px - 18px))
		scale(calc(1 - var(--hint-index) * 0.05));
}
.mobile-card-hint-leave-to {
	opacity: 0;
	filter: blur(4px);
	transform: translateY(calc(var(--hint-index) * 8px + 14px))
		scale(calc(1 - var(--hint-index) * 0.05));
}
.mobile-card-hint-leave-active {
	pointer-events: none;
	transition:
		transform 220ms ease-out,
		opacity 140ms ease-out,
		filter 180ms ease-out;
}
.mobile-card-hints-fast .mobile-card-hint-leave-active {
	transition:
		transform 120ms ease-out,
		opacity 100ms ease-out,
		filter 120ms ease-out;
}
.mobile-card-hints-fast .mobile-card-hint-leave-to {
	filter: blur(2px);
	transform: translateY(calc(var(--hint-index) * 8px + 6px))
		scale(calc(1 - var(--hint-index) * 0.05));
}
@media (prefers-reduced-motion: reduce) {
	.mobile-card-hint,
	.mobile-card-hint-enter-active,
	.mobile-card-hint-leave-active,
	.mobile-card-hints-fast .mobile-card-hint-leave-active {
		transition: none;
	}
	.mobile-card-hint-enter-from,
	.mobile-card-hint-leave-to,
	.mobile-card-hints-fast .mobile-card-hint-leave-to {
		filter: none;
	}
}
</style>
