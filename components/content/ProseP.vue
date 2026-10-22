<template>
	<p :lang="paragraphLang" :class="[paragraphClass, props.class]">
		<slot />
	</p>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

interface ProseParagraphProps {
	class?: unknown
	lang?: string
}

const props = defineProps<ProseParagraphProps>()

const { locale } = useI18n({ useScope: 'global' })

const proseBaseClass =
	'my-3 w-full text-pretty text-justify [text-align-last:left]'
const proseCjkClass = `${proseBaseClass} break-normal [text-justify:inter-character] [line-break:loose]`
const proseEnglishClass = `${proseBaseClass} break-normal hyphens-auto break-words [text-justify:inter-word]`

const paragraphLang = computed(() => {
	const language = props.lang ?? locale.value
	if (language.startsWith('ja')) {
		return 'ja'
	}

	if (language.startsWith('en')) {
		return 'en'
	}

	return 'zh-CN'
})

const paragraphClass = computed(() =>
	paragraphLang.value === 'en' ? proseEnglishClass : proseCjkClass,
)
</script>
