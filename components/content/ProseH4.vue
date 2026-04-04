<template>
	<h4
		:id="id"
		:class="[
			'text-lg text-highlighted font-(family-name:--font-family) font-medium mt-5 mb-2',
			props.class,
		]"
	>
		<a v-if="id && generate" :href="`#${id}`">
			<slot />
		</a>
		<slot v-else />
	</h4>
</template>

<script setup lang="ts">
const props = defineProps<{
	id?: string
	class?: unknown
}>()

const { headings } = useRuntimeConfig().public?.mdc || {}
const id = computed(() => props.id)
const generate = computed(
	() =>
		!!id.value &&
		(typeof headings?.anchorLinks === 'boolean'
			? headings.anchorLinks
			: headings?.anchorLinks?.h4),
)
</script>
