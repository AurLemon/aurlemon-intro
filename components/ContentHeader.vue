<template>
	<div>
		<div
			class="-mt-32 h-54 rounded-b-3xl border-x-2 border-b-2 border-slate-100 dark:border-slate-900/80 bg-white dark:bg-slate-900 overflow-hidden block shadow-[0_32px_48px_rgba(0,0,0,0.03)] relative"
		>
			<img
				:src="bgSrc"
				class="mask-[linear-gradient(to_bottom,transparent_0%,rgba(0,0,0,0.1)_30%,black_100%)] h-full w-full object-cover select-none"
				alt=""
			/>
			<div class="absolute top-0 right-0 left-0 bottom-0">
				<slot />
			</div>
		</div>
		<h1
			class="mt-6 text-4xl font-medium text-center text-slate-900 dark:text-slate-100"
		>
			{{ title }}
		</h1>
	</div>
</template>

<script setup lang="ts">
defineProps<{
	bgSrc: string
	title: string
}>()
</script>
