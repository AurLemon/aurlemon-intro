<template>
	<NuxtLink
		:to="friend.url"
		target="_blank"
		rel="noopener noreferrer"
		class="group relative isolate flex min-w-0 min-h-60 lg:min-h-[420px] flex-col rounded-xl border-6 border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900"
	>
		<div
			class="pointer-events-none absolute inset-0 overflow-hidden rounded-md"
			aria-hidden="true"
		>
			<picture v-if="!backgroundFailed" class="block h-full w-full">
				<source media="(min-width: 64rem)" :srcset="mobileBackgroundUrl" />
				<img
					:key="backgroundUrl"
					:src="backgroundUrl"
					alt=""
					loading="lazy"
					decoding="async"
					class="h-full w-full object-cover object-top"
					:class="
						useCover
							? 'saturate-75'
							: 'saturate-[.25] opacity-45 dark:opacity-35'
					"
					@error="onBackgroundError"
				/>
			</picture>
			<div
				class="absolute inset-x-0 top-1/3 bottom-0 backdrop-blur-[8px] dark:backdrop-blur-[12px] mask-[linear-gradient(to_top,black_0%,rgba(0,0,0,0.95)_18%,rgba(0,0,0,0.82)_32%,rgba(0,0,0,0.6)_46%,rgba(0,0,0,0.35)_60%,rgba(0,0,0,0.14)_72%,rgba(0,0,0,0.03)_84%,transparent_92%)]"
			/>
			<div class="friend-cover-shade absolute inset-0" />
		</div>
		<div
			class="pointer-events-none absolute inset-[-6px] rounded-xl border-6 border-slate-400/60 opacity-0 transition-opacity duration-120 group-hover:opacity-100 group-focus-visible:opacity-100 dark:border-slate-700/80"
			aria-hidden="true"
		/>
		<div class="relative mt-auto flex min-w-0 flex-col items-start gap-1 p-5">
			<img
				:src="friend.icon"
				:alt="friend.name"
				loading="lazy"
				decoding="async"
				class="mb-2 size-11 rounded-lg object-cover"
			/>
			<OverflowMarquee
				as="h2"
				:text="friend.name"
				:show-title="false"
				class="w-full text-xl leading-7 font-medium text-slate-900 dark:text-slate-100"
			/>
			<p
				class="text-sm leading-5 text-slate-600 line-clamp-3 [overflow-wrap:anywhere] dark:text-slate-300"
			>
				{{ friend.desc }}
			</p>
		</div>
	</NuxtLink>
</template>

<script setup lang="ts">
import OverflowMarquee from '~/components/common/OverflowMarquee.vue'
import type { FriendLinkItem } from '~/shared/types/social'
interface Props {
	friend: FriendLinkItem
}
const props = defineProps<Props>()
const coverFailed = ref(false)
const mobileCoverFailed = ref(false)
const backgroundFailed = ref(false)
const useCover = computed(
	() => Boolean(props.friend.coverUrl) && !coverFailed.value,
)
const backgroundUrl = computed(() =>
	useCover.value ? props.friend.coverUrl! : props.friend.icon,
)
const mobileBackgroundUrl = computed(() =>
	!mobileCoverFailed.value && props.friend.mobileCoverUrl
		? props.friend.mobileCoverUrl
		: props.friend.icon,
)
const onBackgroundError = (event: Event) => {
	const image = event.target as HTMLImageElement
	if (
		!mobileCoverFailed.value &&
		props.friend.mobileCoverUrl &&
		image.currentSrc ===
			new URL(props.friend.mobileCoverUrl, window.location.href).href
	) {
		mobileCoverFailed.value = true
		return
	}
	if (useCover.value) coverFailed.value = true
	else backgroundFailed.value = true
}
watch(
	() => [props.friend.coverUrl, props.friend.mobileCoverUrl, props.friend.icon],
	() => {
		coverFailed.value = false
		mobileCoverFailed.value = false
		backgroundFailed.value = false
	},
)
</script>

<style scoped>
.friend-cover-shade {
	--friend-shade-color: var(--color-slate-50);
	background-image: linear-gradient(
		to bottom,
		color-mix(in oklab, var(--friend-shade-color) 42%, transparent) 0%,
		color-mix(in oklab, var(--friend-shade-color) 48%, transparent) 20%,
		color-mix(in oklab, var(--friend-shade-color) 62%, transparent) 40%,
		color-mix(in oklab, var(--friend-shade-color) 80%, transparent) 65%,
		color-mix(in oklab, var(--friend-shade-color) 92%, transparent) 85%,
		color-mix(in oklab, var(--friend-shade-color) 95%, transparent) 100%
	);
}
:global(.dark .friend-cover-shade) {
	--friend-shade-color: var(--color-slate-950);
}
</style>
