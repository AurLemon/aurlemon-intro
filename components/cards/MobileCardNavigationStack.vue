<template>
	<Teleport to="[data-mobile-card-navigation]">
		<div
			v-if="isCompact"
			class="pointer-events-none relative flex justify-center"
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
const { hints } = useMobileCardNavigationStack(
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
	transition:
		transform 240ms cubic-bezier(0.22, 1, 0.36, 1),
		opacity 180ms ease-out;
}
.mobile-card-hint-enter-from,
.mobile-card-hint-leave-to {
	opacity: 0;
	transform: translateY(calc(var(--hint-index) * 8px - 4px))
		scale(calc(1 - var(--hint-index) * 0.05));
}
.mobile-card-hint-leave-active {
	pointer-events: none;
	transition:
		transform 180ms ease-in,
		opacity 180ms ease-out;
}
@media (prefers-reduced-motion: reduce) {
	.mobile-card-hint {
		transition: none;
	}
}
</style>
