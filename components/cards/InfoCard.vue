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
		<div
			class="foreground relative z-1 flex gap-2 lg:gap-4 justify-between lg:justify-center items-center w-full h-full p-3"
		>
			<div class="w-20 h-20 select-none shrink-0">
				<slot name="logo" />
			</div>
			<div class="text-center flex-1 lg:flex-none min-w-0">
				<div
					class="text-3xl font-medium text-slate-800 dark:text-slate-300 truncate overflow-hidden line-clamp-1"
				>
					<slot name="title" />
				</div>
				<div
					class="text-base text-slate-700 dark:text-slate-400 truncate overflow-hidden line-clamp-1"
				>
					<slot name="subtitle" />
				</div>
			</div>
			<div
				class="absolute left-0 right-0 bottom-1 text-xs text-center text-slate-500"
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
	}>(),
	{
		backgroundBlur: 3,
		darkInvert: false,
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
