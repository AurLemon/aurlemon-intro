<template>
	<Teleport to="[data-mobile-card-navigation]">
		<div
			ref="shell"
			v-show="shellVisible"
			:inert="!isCompact || !hint"
			:aria-hidden="!isCompact || !hint"
			class="mobile-hint-shell pointer-events-none relative mx-auto w-72 max-w-full"
		>
			<NuxtLink
				v-if="renderedHint"
				:to="localePath(renderedHint.to)"
				class="mobile-hint-link pointer-events-auto flex min-w-0 items-center justify-center rounded-full border border-slate-300 bg-(--color-surface-0) px-3 py-[5px] text-xs leading-4 font-normal text-slate-500 shadow-sm shadow-slate-950/10 transition-colors hover:bg-(--color-surface-1) focus-visible:outline-2 focus-visible:outline-offset-2 dark:border-slate-700 dark:bg-(--color-surface-1) dark:text-slate-400 dark:shadow-black/20 dark:hover:bg-(--color-surface-2)"
			>
				<span ref="content" class="grid min-w-0">
					<span
						v-for="layer in contentLayers"
						:key="layer.id"
						:data-hint-layer="layer.id"
						:aria-hidden="layer.id !== renderedHint.id"
						class="col-start-1 row-start-1 flex min-w-0 items-center justify-center gap-2"
					>
						<i18n-t
							:keypath="layer.labelKey"
							tag="span"
							scope="global"
							class="min-w-0 text-center"
						>
							<template #page
								><span
									class="px-0.5 font-bold text-slate-800 dark:text-slate-100"
									>{{ $t(layer.pageKey) }}</span
								></template
							>
						</i18n-t>
						<UIcon
							name="i-lucide-arrow-right"
							mode="svg"
							class="size-3.5 shrink-0 text-slate-500 dark:text-slate-400"
							aria-hidden="true"
						/>
					</span>
				</span>
			</NuxtLink>
		</div>
	</Teleport>
</template>

<script setup lang="ts">
import { useReducedMotion } from 'motion-v'
import type { MobileNavigationHint } from '~/composables/useMobileCardNavigationStack'
interface Props {
	container: HTMLElement | null
}
const props = defineProps<Props>()
const { isCompact } = useDisplayMode()
const localePath = useLocalePath()
const reducedMotion = useReducedMotion()
const shell = ref<HTMLElement | null>(null)
const content = ref<HTMLElement | null>(null)
const shellVisible = ref(false)
const renderedHint = shallowRef<MobileNavigationHint>()
const outgoingHint = shallowRef<MobileNavigationHint>()
const contentLayers = computed(() =>
	[outgoingHint.value, renderedHint.value].filter(
		(layer): layer is MobileNavigationHint => !!layer,
	),
)
const definitions: MobileNavigationHint[] = [
	{
		id: 'profile',
		to: '/profile',
		labelKey: 'main.index.card.navigation.profile',
		pageKey: 'main.index.card.navigation.pages.profile',
	},
	{
		id: 'project',
		to: '/project',
		labelKey: 'main.index.card.navigation.project',
		pageKey: 'main.index.card.navigation.pages.project',
	},
	{
		id: 'acg',
		to: '/preference',
		labelKey: 'main.index.card.navigation.acg',
		pageKey: 'main.index.card.navigation.pages.preference',
	},
	{
		id: 'music',
		to: '/preference',
		labelKey: 'main.index.card.navigation.music',
		pageKey: 'main.index.card.navigation.pages.preference',
	},
]
const { hint, direction } = useMobileCardNavigationStack(
	toRef(props, 'container'),
	isCompact,
	definitions,
)
let shellAnimation: Animation | undefined
const contentAnimations = new Set<Animation>()
let contentBusy = false
let targetVisible = false
let revision = 0
let disposed = false

const syncVisibility = async (visible: boolean, currentRevision: number) => {
	const element = shell.value
	if (!element) return
	// 取消旧动画前先保留屏幕上的实际帧，反向滚动从这里继续，不能重置入场。
	const current = shellVisible.value ? getComputedStyle(element) : undefined
	const from = {
		opacity: current?.opacity ?? '0',
		transform: current?.transform ?? `translateY(${-direction.value * 12}px)`,
	}
	shellAnimation?.cancel()
	shellAnimation = undefined
	const to = {
		opacity: visible ? '1' : '0',
		transform: visible
			? 'translateY(0)'
			: `translateY(${direction.value * 12}px)`,
	}
	Object.assign(element.style, to)
	if (visible) shellVisible.value = true
	await nextTick()
	if (disposed || currentRevision !== revision) return
	if (reducedMotion.value) {
		shellVisible.value = visible
		return
	}
	const animation = element.animate([from, to], {
		duration: visible ? 320 : 220,
		easing: visible ? 'cubic-bezier(0.22, 1, 0.36, 1)' : 'ease-out',
	})
	shellAnimation = animation
	try {
		await animation.finished
		if (disposed || currentRevision !== revision) return
		shellVisible.value = visible
		shellAnimation = undefined
	} catch {
		// 反向接管与组件卸载会取消动画，过期完成状态不得隐藏新提示。
	}
}
const syncContent = async () => {
	if (contentBusy || disposed) return
	contentBusy = true
	try {
		while (!disposed) {
			const next = isCompact.value ? hint.value : undefined
			if (!next || next.id === renderedHint.value?.id) break
			if (!renderedHint.value || !shellVisible.value || reducedMotion.value) {
				renderedHint.value = next
				break
			}
			// 已开始的交叠完整播放，期间只记住最新目标，不改写正在显示的文字。
			const sign = direction.value
			outgoingHint.value = renderedHint.value
			renderedHint.value = next
			await nextTick()
			if (disposed || !content.value) break
			const layers =
				content.value.querySelectorAll<HTMLElement>('[data-hint-layer]')
			for (const layer of layers) {
				const incoming = layer.dataset.hintLayer === next.id
				const animation = layer.animate(
					incoming
						? [
								{ opacity: 0, transform: `translateY(${-sign * 3}px)` },
								{
									opacity: 1,
									transform: `translateY(${sign * 0.7}px)`,
									offset: 0.7,
								},
								{ opacity: 1, transform: 'translateY(0)' },
							]
						: [
								{ opacity: 1, transform: 'translateY(0)' },
								{ opacity: 0, transform: `translateY(${sign * 3}px)` },
							],
					{
						duration: incoming ? 300 : 200,
						easing: 'ease-out',
						fill: 'forwards',
					},
				)
				contentAnimations.add(animation)
			}
			await Promise.allSettled(
				[...contentAnimations].map((animation) => animation.finished),
			)
			if (disposed) break
			outgoingHint.value = undefined
			await nextTick()
			for (const animation of contentAnimations) animation.cancel()
			contentAnimations.clear()
		}
	} finally {
		contentBusy = false
	}
}
watch(
	[hint, isCompact, shell, reducedMotion],
	() => {
		if (disposed || !shell.value) return
		if (reducedMotion.value) {
			for (const animation of contentAnimations) animation.cancel()
		}
		void syncContent()
		const visible = isCompact.value && !!hint.value
		if (visible !== targetVisible || (reducedMotion.value && shellAnimation)) {
			targetVisible = visible
			void syncVisibility(visible, ++revision)
		}
	},
	{ flush: 'post' },
)
onBeforeUnmount(() => {
	disposed = true
	revision++
	shellAnimation?.cancel()
	for (const animation of contentAnimations) animation.cancel()
	contentAnimations.clear()
})
</script>

<style scoped>
.mobile-hint-shell {
	opacity: 0;
}
.mobile-hint-shell[inert] .mobile-hint-link {
	pointer-events: none;
}
</style>
