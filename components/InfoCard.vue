<template>
	<div
		class="border-6 border-slate-200 hover:border-slate-400/60 dark:border-slate-800 rounded-xl relative h-40 transition"
	>
		<div class="background absolute -z-1 top-0 left-0 right-0 bottom-0">
			<img
				:src="backgroundSrc"
				class="w-full h-full block object-cover select-none dark:filter-[invert(1)]"
			/>
		</div>
		<div
			class="foreground relative z-1 flex gap-4 justify-center items-center w-full h-full pb-3"
		>
			<div class="w-20 h-20 select-none">
				<slot name="logo" />
			</div>
			<div class="text-center">
				<div class="text-3xl font-medium text-slate-800 dark:text-slate-300">
					<slot name="title" />
				</div>
				<div class="text-base text-slate-700 dark:text-slate-400">
					<slot name="subtitle" />
				</div>
			</div>
			<div class="absolute bottom-1 text-xs text-slate-500">
				<slot name="type" />
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
defineProps<{
	backgroundSrc: string
}>()
</script>
