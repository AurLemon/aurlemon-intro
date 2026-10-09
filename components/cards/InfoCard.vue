<template>
	<div
		ref="card"
		class="group relative h-40 rounded-xl border-6 border-slate-200 dark:border-slate-800"
	>
		<div
			class="pointer-events-none absolute inset-[-6px] z-2 rounded-xl border-6 border-slate-400/60 opacity-0 transition-opacity duration-120 group-hover:opacity-100 dark:border-slate-700/80"
			aria-hidden="true"
		/>
		<div
			class="background absolute z-0 top-0 left-0 right-0 bottom-0 overflow-hidden"
			:style="backgroundStyle"
		>
			<SkeletonImage
				:src="backgroundSrc"
				alt=""
				class="h-full w-full"
				image-class="w-full h-full block object-cover select-none"
				skeleton-class="h-full w-full"
				:class="darkInvert ? 'dark:filter-[invert(1)]' : ''"
			/>
		</div>
		<div class="foreground relative z-1 w-full h-full">
			<Transition v-if="contentKey" name="info-card-content" mode="out-in">
				<div
					:key="contentKey"
					ref="contentRow"
					class="absolute inset-0 flex items-center gap-3 px-4.5 py-3 lg:justify-center lg:gap-4"
					:class="animatedTitle ? 'justify-center' : 'justify-between'"
				>
					<div class="h-20 w-20 shrink-0 select-none">
						<slot name="logo" />
					</div>
					<div
						ref="textColumn"
						class="min-w-0 text-center"
						:class="animatedTitle ? 'flex-none' : 'flex-1 lg:flex-none'"
						:style="animatedTitle ? animatedColumnStyle : undefined"
					>
						<div
							class="text-3xl font-medium text-slate-800 dark:text-slate-300"
							:class="
								animatedTitle ? '' : 'line-clamp-1 overflow-hidden truncate'
							"
						>
							<slot
								name="title"
								:layout-target="textColumn"
								:available-width="availableTitleWidth"
								:minimum-width="subtitleWidth"
							/>
						</div>
						<div
							class="line-clamp-1 overflow-hidden truncate text-base text-slate-700 dark:text-slate-400"
						>
							<span ref="subtitleText" class="inline-block whitespace-nowrap"
								><slot name="subtitle"
							/></span>
						</div>
					</div>
				</div>
			</Transition>
			<div
				v-else
				class="flex h-full w-full items-center justify-between gap-3 px-4.5 py-3 lg:justify-center lg:gap-4"
			>
				<div class="h-20 w-20 shrink-0 select-none">
					<slot name="logo" />
				</div>
				<div class="min-w-0 flex-1 text-center lg:flex-none">
					<div
						class="line-clamp-1 overflow-hidden truncate text-3xl font-medium text-slate-800 dark:text-slate-300"
					>
						<slot
							name="title"
							:layout-target="textColumn"
							:available-width="availableTitleWidth"
							:minimum-width="subtitleWidth"
						/>
					</div>
					<div
						class="line-clamp-1 overflow-hidden truncate text-base text-slate-700 dark:text-slate-400"
					>
						<slot name="subtitle" />
					</div>
				</div>
			</div>
			<div
				class="absolute right-0 bottom-1 left-0 text-center text-xs text-slate-500"
			>
				<slot name="type" />
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

interface TitleSlotProps {
	layoutTarget: HTMLElement | null
	availableWidth: number
	minimumWidth: number
}

interface Slots {
	title(props: TitleSlotProps): unknown
	logo(): unknown
	subtitle(): unknown
	type(): unknown
}

interface Props {
	backgroundSrc: string
	backgroundBlur?: number | string
	darkInvert?: boolean
	contentKey?: string | number | null
	animatedTitle?: boolean
}

defineSlots<Slots>()

const props = withDefaults(defineProps<Props>(), {
	backgroundBlur: 3,
	darkInvert: false,
	contentKey: null,
	animatedTitle: false,
})

const card = ref<HTMLElement | null>(null)
const contentRow = ref<HTMLElement | null>(null)
const textColumn = ref<HTMLElement | null>(null)
const subtitleText = ref<HTMLElement | null>(null)
const availableTitleWidth = ref(0)
const subtitleWidth = ref(0)
let resizeObserver: ResizeObserver | undefined

const animatedColumnStyle = computed(() => ({
	width: 'max-content',
	maxWidth:
		availableTitleWidth.value > 0
			? `${availableTitleWidth.value}px`
			: 'calc(100% - 6rem)',
}))

const measureTitleSpace = () => {
	if (!props.animatedTitle || !contentRow.value) return
	const row = contentRow.value
	const style = getComputedStyle(row)
	const logo = row.firstElementChild as HTMLElement | null
	availableTitleWidth.value = Math.max(
		0,
		row.clientWidth -
			parseFloat(style.paddingLeft) -
			parseFloat(style.paddingRight) -
			parseFloat(style.columnGap) -
			(logo?.offsetWidth ?? 80),
	)
	subtitleWidth.value = subtitleText.value?.scrollWidth ?? 0
}

watch([contentRow, subtitleText], () => {
	void nextTick(measureTitleSpace)
})
onMounted(() => {
	if (!props.animatedTitle) return
	resizeObserver = new ResizeObserver(measureTitleSpace)
	resizeObserver.observe(card.value!)
	document.fonts.addEventListener('loadingdone', measureTitleSpace)
	measureTitleSpace()
})
onBeforeUnmount(() => {
	resizeObserver?.disconnect()
	document.fonts.removeEventListener('loadingdone', measureTitleSpace)
})

const backgroundStyle = computed(() => {
	const blurValue =
		typeof props.backgroundBlur === 'number'
			? `${props.backgroundBlur}px`
			: props.backgroundBlur

	return {
		filter: `blur(${blurValue}) opacity(0.1)`,
	}
})
</script>

<style scoped>
.info-card-content-enter-active,
.info-card-content-leave-active {
	transition:
		opacity 220ms ease,
		transform 220ms ease,
		filter 220ms ease;
}

.info-card-content-enter-from,
.info-card-content-leave-to {
	opacity: 0;
	filter: blur(4px);
}

.info-card-content-enter-from {
	transform: translateY(8px);
}

.info-card-content-leave-to {
	transform: translateY(-8px);
}
</style>
