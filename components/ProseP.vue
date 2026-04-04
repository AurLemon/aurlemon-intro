<template>
	<p :class="['my-3 leading-7 text-pretty', props.class]">
		<slot />
	</p>
</template>

<script setup lang="ts">
const props = defineProps<{
	class?: unknown
}>()
</script>
