<template>
	<div
		class="border-6 border-slate-200 hover:border-slate-400/60 dark:border-slate-800 rounded-xl relative h-40 transition"
	>
		<div
			class="background absolute -z-1 top-0 left-0 right-0 bottom-0 overflow-hidden"
			:style="backgroundStyle"
		>
			<img
				:src="backgroundSrc"
				:class="[
					'w-full h-full block object-cover select-none',
					darkInvert ? 'dark:filter-[invert(1)]' : '',
				]"
			/>
		</div>
		<div
			class="foreground relative z-1 flex gap-2 lg:gap-4 justify-between lg:justify-center items-center w-full h-full p-3"
		>
			<div class="w-20 h-20 select-none">
				<slot name="logo" />
			</div>
			<div class="text-center flex-1 lg:flex-none">
				<div class="text-3xl font-medium text-slate-800 dark:text-slate-300">
					<slot name="title" />
				</div>
				<div class="text-base text-slate-700 dark:text-slate-400">
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
