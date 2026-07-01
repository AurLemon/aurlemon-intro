<template>
	<div
		class="mx-auto w-full max-w-4xl min-w-0 py-6 pb-16 text-[18px] font-serif font-medium text-slate-900 dark:text-slate-100 lg:px-6"
	>
		<ContentRenderer v-if="resolvedDoc" :value="resolvedDoc" />
		<ContentFooter v-if="resolvedDoc" class="mt-14" :doc="resolvedDoc" />
	</div>
</template>

<script setup lang="ts">
const props = withDefaults(
	defineProps<{
		page: string
		fallbackLocale?: string
		doc?: {
			body?: unknown
			updatedAt?: string
		} | null
	}>(),
	{
		fallbackLocale: 'zh-cn',
		doc: undefined,
	},
)

const localizedContentState =
	props.doc === undefined
		? await useLocalizedContentDoc(
				() => props.page,
				() => props.fallbackLocale,
			)
		: { data: ref(null) }

const resolvedDoc = computed(
	() => props.doc ?? localizedContentState.data.value,
)
</script>
