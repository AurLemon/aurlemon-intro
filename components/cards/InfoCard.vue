<template>
	<div
		class="group relative h-40 rounded-xl border-6 border-slate-200 dark:border-slate-800"
	>
		<div
			class="pointer-events-none absolute inset-[-6px] z-2 rounded-xl border-6 border-slate-400/60 opacity-0 transition-opacity duration-120 group-hover:opacity-100 dark:border-slate-700/80"
			aria-hidden="true"
		/>
		<div
			class="background absolute z-0 top-0 left-0 right-0 bottom-0 overflow-hidden"
			:style="backgroundStyle"
		>
			<SkeletonImage
				:src="backgroundSrc"
				alt=""
				class="h-full w-full"
				image-class="w-full h-full block object-cover select-none"
				skeleton-class="h-full w-full"
				:class="darkInvert ? 'dark:filter-[invert(1)]' : ''"
			/>
		</div>
		<div class="foreground relative z-1 w-full h-full">
			<Transition v-if="contentKey" name="info-card-content" mode="out-in">
				<div
					:key="contentKey"
					class="absolute inset-0 flex items-center justify-between gap-3 px-4.5 py-3 lg:justify-center lg:gap-4"
				>
					<div class="h-20 w-20 shrink-0 select-none">
						<slot name="logo" />
					</div>
					<div class="min-w-0 flex-1 text-center lg:flex-none">
						<div
							class="line-clamp-1 overflow-hidden truncate text-3xl font-medium text-slate-800 dark:text-slate-300"
						>
							<slot name="title" />
						</div>
						<div
							class="line-clamp-1 overflow-hidden truncate text-base text-slate-700 dark:text-slate-400"
						>
							<slot name="subtitle" />
						</div>
					</div>
				</div>
			</Transition>
			<div
				v-else
				class="flex h-full w-full items-center justify-between gap-3 px-4.5 py-3 lg:justify-center lg:gap-4"
			>
				<div class="h-20 w-20 shrink-0 select-none">
					<slot name="logo" />
				</div>
				<div class="min-w-0 flex-1 text-center lg:flex-none">
					<div
						class="line-clamp-1 overflow-hidden truncate text-3xl font-medium text-slate-800 dark:text-slate-300"
					>
						<slot name="title" />
					</div>
					<div
						class="line-clamp-1 overflow-hidden truncate text-base text-slate-700 dark:text-slate-400"
					>
						<slot name="subtitle" />
					</div>
				</div>
			</div>
			<div
				class="absolute right-0 bottom-1 left-0 text-center text-xs text-slate-500"
			>
				<slot name="type" />
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
	defineProps<{
		backgroundSrc: string
		backgroundBlur?: number | string
		darkInvert?: boolean
		contentKey?: string | number | null
	}>(),
	{
		backgroundBlur: 3,
		darkInvert: false,
		contentKey: null,
	},
)

const backgroundStyle = computed(() => {
	const blurValue =
		typeof props.backgroundBlur === 'number'
			? `${props.backgroundBlur}px`
			: props.backgroundBlur

	return {
		filter: `blur(${blurValue}) opacity(0.1)`,
	}
})
</script>

<style scoped>
.info-card-content-enter-active,
.info-card-content-leave-active {
	transition:
		opacity 220ms ease,
		transform 220ms ease,
		filter 220ms ease;
}

.info-card-content-enter-from,
.info-card-content-leave-to {
	opacity: 0;
	filter: blur(4px);
}

.info-card-content-enter-from {
	transform: translateY(8px);
}

.info-card-content-leave-to {
	transform: translateY(-8px);
}
</style>
