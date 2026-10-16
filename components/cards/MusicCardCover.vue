<template>
	<div
		class="relative isolate h-full w-full overflow-hidden rounded-lg bg-slate-200/60 [clip-path:inset(0_round_var(--radius-lg))] dark:bg-slate-800/60"
	>
		<Transition name="music-cover" :duration="700" appear>
			<div
				:key="cover.id"
				class="absolute inset-0 h-full w-full overflow-hidden rounded-lg"
			>
				<img
					:src="cover.url"
					:alt="alt"
					class="block h-full w-full rounded-lg object-cover"
					loading="eager"
					decoding="async"
				/>
			</div>
		</Transition>
		<span
			aria-hidden="true"
			class="pointer-events-none absolute inset-0 z-2 rounded-lg border border-slate-300/60 dark:border-slate-800/60"
		/>
	</div>
</template>

<script setup lang="ts">
import type { CardImageCover } from '~/shared/types/card-image-atlas'

interface Props {
	cover: CardImageCover
	alt: string
}
defineProps<Props>()
</script>

<style scoped>
.music-cover-enter-active,
.music-cover-leave-active {
	transition:
		transform 700ms cubic-bezier(0.22, 1, 0.36, 1),
		opacity 280ms ease-out,
		filter 520ms cubic-bezier(0.25, 0.46, 0.45, 0.94) 40ms;
}
.music-cover-enter-active {
	z-index: 1;
}
.music-cover-leave-active {
	z-index: 0;
}
.music-cover-enter-from {
	transform: translateX(-16px) scale(0.92);
	opacity: 0;
	filter: blur(4px);
}
.music-cover-leave-to {
	/* 保留完整底图，等新图覆盖后才移除，交叉淡化不会露出背景。 */
	transform: none;
	opacity: 1;
	filter: none;
}
@media (prefers-reduced-motion: reduce) {
	.music-cover-enter-active,
	.music-cover-leave-active {
		transition: none;
	}
	.music-cover-enter-from,
	.music-cover-leave-to {
		transform: none;
		filter: none;
	}
}
</style>
