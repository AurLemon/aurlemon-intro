<template>
	<h6
		:id="id"
		:class="[
			'text-base text-highlighted font-(family-name:--font-family) font-medium mt-4 mb-2',
			props.class,
		]"
	>
		<a v-if="id && generate" :href="`#${id}`">
			<slot />
		</a>
		<slot v-else />
	</h6>
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
			: headings?.anchorLinks?.h6),
)
</script>
