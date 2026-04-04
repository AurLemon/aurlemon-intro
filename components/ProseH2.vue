<template>
	<h2
		:id="id"
		:class="[
			'relative text-2xl text-highlighted font-(family-name:--font-family) font-medium mt-8 mb-3',
			props.class,
		]"
	>
		<a
			v-if="id && generate"
			:href="`#${id}`"
			class="group lg:ps-2 lg:-ms-2 [&>code]:border-dashed hover:[&>code]:border-primary hover:[&>code]:text-primary [&>code]:text-xl/7 [&>code]:font-medium [&>code]:transition-colors"
		>
			<span
				class="absolute -ms-8 top-1 hidden rounded-md bg-elevated p-1 text-muted opacity-0 transition group-hover:opacity-100 group-focus:opacity-100 hover:text-primary lg:flex"
			>
				<UIcon :name="appConfig.ui.icons.hash" class="size-4 shrink-0" />
			</span>
			<slot />
		</a>
		<slot v-else />
	</h2>
</template>

<script setup lang="ts">
const props = defineProps<{
	id?: string
	class?: unknown
}>()

const appConfig = useAppConfig()
const { headings } = useRuntimeConfig().public?.mdc || {}
const id = computed(() => props.id)
const generate = computed(
	() =>
		!!id.value &&
		(typeof headings?.anchorLinks === 'boolean'
			? headings.anchorLinks
			: headings?.anchorLinks?.h2),
)
</script>
