<template>
	<hr
		:class="['my-8! border-slate-400! dark:border-slate-700!', props.class]"
	/>
</template>

<script setup lang="ts">
const props = defineProps<{
	class?: unknown
}>()
</script>
