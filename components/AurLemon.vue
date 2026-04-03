<template>
	<div class="relative w-fit">
		<div class="relative z-1 flex items-center gap-1.5">
			<img
				src="~/assets/sitemark/avatar_mark.jpg"
				class="block rounded-full h-7.5 border-[#236F95] border-1.5 select-none"
			/>
			<AurLemon class="h-6.75 text-[#236F95] dark:text-[#effaff]" />
		</div>
		<div
			class="absolute -left-1 -right-2 bottom-0.5 -z-1 h-2.5 bg-[linear-gradient(to_right,transparent,rgba(55,145,190,0.1)_15%,rgba(55,145,190,0.15)_50%,rgba(55,145,190,0.1)_85%,transparent)]"
		/>
	</div>
</template>

<script setup lang="ts">
import AurLemon from '~/assets/sitemark/text_mark.svg'
</script>
