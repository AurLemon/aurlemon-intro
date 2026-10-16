<template>
	<div class="min-w-0">
		<ContentHeader
			:page="page"
			:title="$t(`main.contentPages.${page}.title`)"
			:doc="doc"
		>
			<slot v-if="$slots.overview" name="overview" />
		</ContentHeader>
		<div>
			<ContentContainer
				:page="page"
				:fallback-locale="fallbackLocale"
				:doc="doc"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
interface Props {
	page: string
	fallbackLocale?: string
}

const props = withDefaults(defineProps<Props>(), { fallbackLocale: 'zh-cn' })
const { data: doc } = await useLocalizedContentDoc(
	() => props.page,
	() => props.fallbackLocale,
)
</script>
