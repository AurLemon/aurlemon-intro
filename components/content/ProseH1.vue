<template>
	<h1
		:id="id"
		:class="[
			'text-4xl text-highlighted font-(family-name:--font-family) font-medium mb-6',
			props.class,
		]"
	>
		<a
			v-if="id && generate"
			:href="`#${id}`"
			class="inline-flex items-center gap-2"
		>
			<slot />
		</a>
		<slot v-else />
	</h1>
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
			: headings?.anchorLinks?.h1),
)
</script>
