<template>
	<span
		class="relative isolate inline-flex items-baseline whitespace-nowrap px-[0.16em] before:absolute before:inset-x-0 before:bottom-[0.1em] before:-z-10 before:h-[0.46em] before:-rotate-2 before:rounded-[0.06em] before:bg-warning-200/65 before:content-[''] dark:before:bg-warning-300/25"
		:class="spacingClasses"
		><span v-if="emoji && emojiPosition === 'start'" class="font-normal">{{
			emoji
		}}</span
		><span class="font-semibold tracking-[0.03em]">{{ text }}</span
		><span v-if="emoji && emojiPosition === 'end'" class="font-normal">{{
			emoji
		}}</span></span
	>
</template>

<script setup lang="ts">
interface HighlightTextProps {
	text: string
	emoji?: string
	emojiPosition?: 'start' | 'end'
	beforeText?: string
	afterText?: string
	/** 前文在移动端换行时，桌面端仍按完整前文计算间距。 */
	desktopBeforeText?: string
}

type NeighborKind = 'empty' | 'punctuation' | 'text'

const { locale } = useI18n({ useScope: 'global' })

const props = withDefaults(defineProps<HighlightTextProps>(), {
	emoji: '',
	emojiPosition: 'start',
	beforeText: '',
	afterText: '',
	desktopBeforeText: undefined,
})

const getNeighborKind = (
	text: string,
	side: 'before' | 'after',
): NeighborKind => {
	const characters = Array.from(text.trim())
	const character = side === 'before' ? characters.at(-1) : characters[0]
	if (!character) return 'empty'
	return /[\p{P}\p{S}]/u.test(character) ? 'punctuation' : 'text'
}

// 间距属于整个组合，emoji 与文字之间不设 gap。
const leftSpacing = {
	empty: 'ml-0',
	punctuation: 'ml-[0.04em]',
	text: 'ml-0',
}
const rightSpacing = {
	empty: 'mr-0',
	punctuation: 'mr-[0.04em]',
	text: 'mr-0',
}
const desktopLeftSpacing = {
	empty: 'sm:ml-0',
	punctuation: 'sm:ml-[0.04em]',
	text: 'sm:ml-[0.22em]',
}

const desktopRightSpacing = {
	empty: 'sm:mr-0',
	punctuation: 'sm:mr-[0.04em]',
	text: 'sm:mr-[0.22em]',
}

const spacingClasses = computed(() => {
	const before = getNeighborKind(props.beforeText, 'before')
	const after = getNeighborKind(props.afterText, 'after')
	const desktopBefore = getNeighborKind(
		props.desktopBeforeText ?? props.beforeText,
		'before',
	)
	// 移动端不加文字大间距；英文在所有尺寸下都不加。
	const allowLargeSpacing = locale.value.split('-')[0] !== 'en'

	return [
		leftSpacing[before],
		rightSpacing[after],
		desktopLeftSpacing[
			!allowLargeSpacing && desktopBefore === 'text' ? 'empty' : desktopBefore
		],
		desktopRightSpacing[
			!allowLargeSpacing && after === 'text' ? 'empty' : after
		],
	]
})
</script>
