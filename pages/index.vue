<template>
	<div class="mt-4">
		<!-- 顶部问候 -->
		<div class="mx-2">
			<img
				src="~/assets/sitemark/avatar_mark.jpg"
				class="block rounded-full h-42 border-[#236F95] border-2 select-none shadow-[0_0_32px_rgba(190,215,212,0.6)] dark:shadow-[0_0_32px_rgba(190,215,212,0.1)]"
			/>
			<div
				class="mt-6 text-4xl font-serif text-slate-900 dark:text-slate-100 font-medium leading-snug"
			>
				{{ $t('main.index.line1') }}<br />
				<i18n-t keypath="main.index.line2" tag="span">
					<template #age>{{ age }}</template>
					<template #doubtful>
						<span class="text-xl italic">{{ $t('main.index.doubtful') }}</span>
					</template>
				</i18n-t>
			</div>
		</div>

		<!-- 信息卡片 -->
		<div class="grid grid-col-2"></div>
	</div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'

const age = dayjs().diff('2006-05-18', 'year')
</script>
