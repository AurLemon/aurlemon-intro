import {
	computed,
	nextTick,
	onBeforeUnmount,
	onMounted,
	ref,
	watch,
	type Ref,
} from 'vue'
import { animate } from 'motion-v'
import { CARD_PATTERN_DRIFT_START_MS } from '~/components/cards/cardPattern'

interface CardPatternDriftOptions {
	background: Ref<HTMLElement | null>
	enabled: Readonly<Ref<boolean>>
	focusActive: Readonly<Ref<boolean>>
}

export const useCardPatternDrift = ({
	background,
	enabled,
	focusActive,
}: CardPatternDriftOptions) => {
	const hovered = ref(false)
	const focused = ref(false)
	const active = computed(
		() =>
			enabled.value && (hovered.value || (focusActive.value && focused.value)),
	)
	let card: HTMLElement | null = null
	let animations: Animation[] = []
	let startup: ReturnType<typeof animate> | undefined
	let generation = 0
	let mounted = false

	const stop = () => {
		generation++
		startup?.stop()
		startup = undefined
		for (const animation of animations) {
			animation.pause()
		}
	}

	const start = async () => {
		stop()
		const currentGeneration = generation
		await nextTick()
		if (!mounted || !active.value || currentGeneration !== generation) return
		animations = [
			...(background.value?.querySelectorAll<HTMLElement>(
				'.card-pattern-background-pattern',
			) ?? []),
		]
			.flatMap((element) => element.getAnimations())
			.filter(
				(animation) =>
					animation instanceof CSSAnimation &&
					animation.animationName.startsWith('card-pattern-background-drift'),
			)
		if (!animations.length) return
		for (const animation of animations) {
			animation.pause()
			animation.playbackRate = 0.001
			animation.play()
		}
		startup = animate(0, 1, {
			duration: CARD_PATTERN_DRIFT_START_MS / 1000,
			ease: 'easeInOut',
			onUpdate: (speed) => {
				if (!mounted || !active.value || currentGeneration !== generation)
					return
				for (const animation of animations)
					animation.updatePlaybackRate(Math.max(0.001, speed))
			},
		})
	}

	const onPointerEnter = (event: PointerEvent) => {
		hovered.value = event.pointerType !== 'touch'
	}
	const onPointerLeave = () => {
		hovered.value = false
	}
	const onFocusIn = () => {
		focused.value = true
	}
	const onFocusOut = (event: FocusEvent) => {
		focused.value =
			event.relatedTarget instanceof Node &&
			!!card?.contains(event.relatedTarget)
	}

	watch(active, (value) => {
		if (value) void start()
		else stop()
	})

	onMounted(() => {
		mounted = true
		card = background.value?.closest<HTMLElement>('.group\\/card') ?? null
		card?.addEventListener('pointerenter', onPointerEnter)
		card?.addEventListener('pointerleave', onPointerLeave)
		card?.addEventListener('focusin', onFocusIn)
		card?.addEventListener('focusout', onFocusOut)
		hovered.value = card?.matches(':hover') ?? false
		focused.value = card?.matches(':focus-within') ?? false
	})

	onBeforeUnmount(() => {
		mounted = false
		stop()
		card?.removeEventListener('pointerenter', onPointerEnter)
		card?.removeEventListener('pointerleave', onPointerLeave)
		card?.removeEventListener('focusin', onFocusIn)
		card?.removeEventListener('focusout', onFocusOut)
	})
}
