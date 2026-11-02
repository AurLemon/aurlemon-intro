<template>
	<article
		class="group relative isolate flex min-w-0 min-h-60 lg:min-h-[420px] flex-col rounded-xl border-6 border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900"
	>
		<div
			class="pointer-events-none absolute inset-0 overflow-hidden rounded-md"
			aria-hidden="true"
		>
			<picture
				v-if="!backgroundFailed && (backgroundUrl || mobileBackgroundUrl)"
				class="block h-full w-full"
				:class="{ 'lg:hidden': !mobileBackgroundUrl }"
			>
				<source media="(min-width: 64rem)" :srcset="mobileBackgroundUrl" />
				<img
					:key="backgroundUrl"
					:src="backgroundUrl || undefined"
					alt=""
					loading="lazy"
					decoding="async"
					class="h-full w-full object-cover object-top brightness-100 transition-[filter] duration-200 group-hover:brightness-95 group-focus-within:brightness-95 motion-reduce:transition-none"
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
			class="pointer-events-none absolute inset-[-6px] rounded-xl border-6 border-slate-400/60 opacity-0 transition-opacity duration-120 group-hover:opacity-100 group-focus-within:opacity-100 dark:border-slate-700/80"
			aria-hidden="true"
		/>

		<NuxtLink
			:to="friend.url"
			target="_blank"
			rel="noopener noreferrer"
			:aria-label="friend.name"
			class="absolute inset-0 rounded-md focus-visible:outline-2 focus-visible:outline-primary-500"
		/>
		<div
			class="pointer-events-none relative mt-auto flex min-w-0 flex-col items-start gap-1 p-5"
		>
			<div class="mb-2 flex w-full min-w-0 items-baseline gap-1.5">
				<UAvatar
					:src="friend.icon || undefined"
					:alt="friend.name"
					loading="lazy"
					decoding="async"
					class="size-12 shrink-0"
					:class="
						friend.iconRounded === false
							? 'rounded-none'
							: 'rounded-lg border border-slate-300/80 dark:border-slate-600/80'
					"
					:ui="{
						root: 'overflow-hidden bg-transparent',
						image: 'rounded-none object-cover',
					}"
				/>
				<UPopover
					v-if="friend.ownerAccount"
					:content="{ side: 'top', align: 'start', sideOffset: 8 }"
					:ui="{ content: 'z-[43120] pointer-events-auto shadow-sm' }"
				>
					<button
						type="button"
						class="pointer-events-auto relative z-10 inline-flex max-w-full min-w-0 cursor-pointer items-center rounded-md text-xs text-slate-600 transition-colors hover:text-slate-500 focus-visible:outline-2 focus-visible:outline-slate-500 dark:text-slate-300 dark:hover:text-slate-400 sm:-translate-y-1"
					>
						<FriendLinkMarquee :text="`@${friend.ownerAccount.username}`" />
					</button>
					<template #content>
						<a
							:href="friend.ownerAccount.profileUrl"
							target="_blank"
							rel="noopener noreferrer"
							class="flex max-w-[min(18rem,calc(100vw-2rem))] items-center gap-2 rounded-[inherit] py-2 pr-3 pl-2 no-underline transition-opacity hover:no-underline hover:opacity-70 focus-visible:outline-2 focus-visible:outline-slate-500 motion-reduce:transition-none"
						>
							<UAvatar
								:src="socialAvatar(friend.ownerAccount.avatarUrl) || undefined"
								:alt="friend.ownerAccount.username"
								class="size-8 shrink-0 rounded-full border border-slate-300/80 dark:border-slate-600/80"
								:ui="{ root: 'bg-transparent', image: 'object-cover' }"
							/>
							<div class="flex min-w-0 flex-col items-start">
								<span
									class="min-w-0 text-[13px] leading-4 font-normal text-slate-700 [overflow-wrap:anywhere] dark:text-slate-200"
									>@{{ friend.ownerAccount.username }}</span
								>
								<span
									class="text-[11px] leading-4 text-slate-500 dark:text-slate-400"
									>{{
										friend.ownerAccount.provider === 'GITHUB'
											? 'GitHub'
											: 'LinuxDO'
									}}</span
								>
							</div>
						</a>
					</template>
				</UPopover>
			</div>
			<FriendLinkTitle :text="friend.name" />
			<p
				class="text-sm leading-5 text-slate-600 line-clamp-3 [overflow-wrap:anywhere] dark:text-slate-300"
			>
				{{ friend.desc }}
			</p>
		</div>
	</article>
</template>

<script setup lang="ts">
import FriendLinkMarquee from './FriendLinkMarquee.vue'
import FriendLinkTitle from './FriendLinkTitle.vue'
import type { FriendLinkItem } from '~/shared/types/social'
interface Props {
	friend: FriendLinkItem
}
const props = defineProps<Props>()
const socialAvatar = useSocialAvatar()
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
