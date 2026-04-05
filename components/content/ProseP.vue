<template>
	<p
		:class="[
			'my-3 leading-7 text-pretty [hyphens:auto] [text-justify:inter-character] break-words',
			props.class,
		]"
	>
		<slot />
	</p>
</template>

<script setup lang="ts">
const props = defineProps<{
	class?: unknown
}>()
</script>
