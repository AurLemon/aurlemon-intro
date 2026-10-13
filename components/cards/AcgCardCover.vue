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
				:style="{ left: `${[0, 12, 32][index]}%`, zIndex: index }"
			>
				<SkeletonImage
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
.acg-stack-move,
.acg-stack-enter-active,
.acg-stack-leave-active {
	transition:
		transform 600ms cubic-bezier(0.22, 1, 0.36, 1),
		opacity 600ms ease,
		filter 600ms ease;
}
.acg-stack-move {
	/* Vue 的 FLIP 检测要求 transform transition 比 CSS animation 更长。 */
	animation: acg-stack-rearrange 500ms ease;
}
.acg-stack-enter-from {
	transform: translateX(-16px) scale(0.92);
	opacity: 0;
	filter: blur(4px);
}
.acg-stack-leave-to {
	transform: translateX(16px) scale(0.92);
	opacity: 0;
	filter: blur(4px);
}
@keyframes acg-stack-rearrange {
	0%,
	100% {
		opacity: 1;
		filter: blur(0);
	}
	50% {
		opacity: 0.75;
		filter: blur(1.5px);
	}
}
@media (prefers-reduced-motion: reduce) {
	.acg-stack-move,
	.acg-stack-enter-active,
	.acg-stack-leave-active {
		transition: none;
		animation: none;
	}
	.acg-stack-enter-from,
	.acg-stack-leave-to {
		transform: none;
		filter: none;
	}
}
</style>
