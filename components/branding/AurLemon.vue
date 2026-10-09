<template>
	<div class="relative w-fit">
		<div class="relative z-1 flex items-center gap-1.5">
			<img
				src="~/assets/resources/sitemark/avatar_mark.webp"
				class="block rounded-full h-7 border-[#236F95] border-[0.5px] select-none"
			/>
			<component
				:is="animated ? AurLemonHandwriting : AurLemon"
				v-bind="animated ? { loop, getHighlightElement } : {}"
				class="h-7 text-[#236F95] dark:text-[#54aed7]"
			/>
		</div>
		<div
			ref="highlightRef"
			class="absolute -left-1 -right-2 bottom-0.5 z-0 h-2.5 -rotate-2 bg-[linear-gradient(to_right,transparent,rgba(55,145,190,0.1)_15%,rgba(55,145,190,0.15)_50%,rgba(55,145,190,0.1)_85%,transparent)] dark:bg-[linear-gradient(to_right,transparent,rgba(55,145,190,0.15)_15%,rgba(55,145,190,0.3)_50%,rgba(55,145,190,0.15)_85%,transparent)]"
		/>
	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import AurLemon from '~/assets/resources/sitemark/text_mark.svg'
import AurLemonHandwriting from '~/components/branding/AurLemonHandwriting.vue'

interface SiteMarkProps {
	animated?: boolean
	loop?: boolean
}

withDefaults(defineProps<SiteMarkProps>(), { animated: false, loop: false })

const highlightRef = ref<HTMLElement | null>(null)
const getHighlightElement = (): HTMLElement | null => highlightRef.value
</script>
