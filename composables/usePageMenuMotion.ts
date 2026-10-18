import { computed, type Ref } from 'vue'
import type { Options } from 'motion-v'

interface PageMenuMotionOptions {
	menuVisible: Ref<boolean>
	prefersReducedMotion: Ref<boolean>
}

export const usePageMenuMotion = ({
	menuVisible,
	prefersReducedMotion,
}: PageMenuMotionOptions) => {
	const menuRevealMotion = computed<Options>(() => {
		const reduced = prefersReducedMotion.value
		return {
			initial: {
				opacity: 0,
				y: reduced ? 0 : 12,
				scale: reduced ? 1 : 0.99,
				filter: reduced ? 'blur(0px)' : 'blur(2px)',
			},
			animate: {
				opacity: menuVisible.value ? 1 : 0,
				y: menuVisible.value || reduced ? 0 : 12,
				scale: menuVisible.value || reduced ? 1 : 0.99,
				filter: menuVisible.value || reduced ? 'blur(0px)' : 'blur(2px)',
			},
			transition: reduced
				? { duration: 0 }
				: menuVisible.value
					? {
							type: 'spring',
							stiffness: 310,
							damping: 22.5,
							mass: 1,
							opacity: { duration: 0.18, ease: 'easeOut' },
							filter: { duration: 0.26 },
						}
					: {
							type: 'spring',
							stiffness: 310,
							damping: 22.5,
							mass: 1,
							opacity: { duration: 0.34, ease: 'easeOut' },
							filter: { duration: 0.3, ease: 'easeOut' },
						},
		}
	})
	const menuSurfaceMotion = computed<Options>(() => ({
		initial: { width: prefersReducedMotion.value ? '100%' : '65%' },
		animate: {
			width: menuVisible.value || prefersReducedMotion.value ? '100%' : '65%',
		},
		transition: prefersReducedMotion.value
			? { duration: 0 }
			: menuVisible.value
				? { type: 'spring', stiffness: 280, damping: 30, mass: 1 }
				: { type: 'tween', duration: 0.34, ease: 'easeOut' },
	}))
	const menuClipMotion = computed<Options>(() => ({
		initial: {
			clipPath: prefersReducedMotion.value
				? 'inset(0 0% round 999px)'
				: 'inset(0 17.5% round 999px)',
		},
		animate: {
			clipPath:
				menuVisible.value || prefersReducedMotion.value
					? 'inset(0 0% round 999px)'
					: 'inset(0 17.5% round 999px)',
		},
		transition: menuSurfaceMotion.value.transition,
	}))
	const menuTextMotion = computed<Options>(() => ({
		initial: { opacity: 0 },
		animate: { opacity: menuVisible.value ? 1 : 0 },
		transition: prefersReducedMotion.value
			? { duration: 0 }
			: menuVisible.value
				? { duration: 0.13, ease: 'easeOut' }
				: { duration: 0.25, ease: 'easeOut' },
	}))

	return {
		menuRevealMotion,
		menuSurfaceMotion,
		menuClipMotion,
		menuTextMotion,
	}
}
