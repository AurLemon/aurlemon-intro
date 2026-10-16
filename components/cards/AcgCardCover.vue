<template>
	<div
		class="relative isolate h-full w-full overflow-hidden rounded-lg bg-slate-200/60 [clip-path:inset(0_round_var(--radius-lg))] dark:bg-slate-800/60"
		role="img"
		:aria-label="alt"
	>
		<TransitionGroup name="acg-stack" tag="div" class="absolute inset-0">
			<div
				v-for="(cover, index) in covers"
				:key="cover.id"
				:data-cover-id="cover.id"
				aria-hidden="true"
				class="acg-stack-layer absolute inset-y-0 w-[68%]"
				:style="{
					left: `${[0, 12, 32][index]}%`,
					zIndex: index,
					'--cover-focus-blur': `${[0.9, 0.45, 0][index]}px`,
					'--cover-focus-opacity': [0.88, 0.94, 1][index],
				}"
			>
				<SkeletonImage
					loading="eager"
					:reveal-cached-immediately="true"
					:src="cover.url"
					alt=""
					class="h-full w-full overflow-hidden rounded-sm shadow-[-4px_0_6px_0_rgb(15_23_42/45%)]"
					image-class="block h-full w-full rounded-sm object-cover"
					skeleton-class="rounded-sm"
				/>
			</div>
		</TransitionGroup>
		<span
			aria-hidden="true"
			class="pointer-events-none absolute inset-0 z-10 rounded-lg border border-slate-300/60 dark:border-slate-800/60"
		/>
	</div>
</template>

<script setup lang="ts">
import type { CardImageCover } from '~/shared/types/card-image-atlas'
interface Props {
	covers: readonly CardImageCover[]
	alt: string
}
defineProps<Props>()
</script>

<style scoped>
.acg-stack-layer {
	filter: blur(var(--cover-focus-blur));
	opacity: var(--cover-focus-opacity);
	transition:
		filter 520ms cubic-bezier(0.25, 0.46, 0.45, 0.94),
		opacity 280ms ease-out;
}
.acg-stack-move,
.acg-stack-enter-active,
.acg-stack-leave-active {
	transition:
		transform 700ms cubic-bezier(0.22, 1, 0.36, 1),
		opacity 280ms ease-out,
		filter 520ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
.acg-stack-enter-from {
	transform: translateX(-16px) scale(0.92);
	opacity: 0;
	filter: blur(4px);
}
.acg-stack-leave-active {
	transition:
		transform 320ms ease-in,
		opacity 220ms ease-in,
		filter 280ms ease-in;
}
.acg-stack-leave-to {
	transform: translateX(10px) scale(0.96);
	opacity: 0;
	filter: blur(2px);
}
@media (prefers-reduced-motion: reduce) {
	.acg-stack-layer,
	.acg-stack-move,
	.acg-stack-enter-active,
	.acg-stack-leave-active {
		transition: none;
	}
	.acg-stack-enter-from,
	.acg-stack-leave-to {
		transform: none;
		filter: none;
	}
}
</style>
