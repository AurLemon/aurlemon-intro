interface SchoolMotionOptions {
	fullText: HTMLElement
	shortText: HTMLElement | null
	logoTarget: HTMLElement | null
	distance: number
	fullWidth: number
	compactWidth: number
	usesShortName: boolean
	animatedLayout: boolean
}

const SHORT_HOLD = 3000
const FULL_HOLD = 1200
const FADE = 360
const PIXELS_PER_SECOND = 56

export const createSchoolNameAnimations = ({
	fullText,
	shortText,
	logoTarget,
	distance,
	fullWidth,
	compactWidth,
	usesShortName,
	animatedLayout,
}: SchoolMotionOptions): Animation[] => {
	const animations: Animation[] = []
	const travel = (distance / PIXELS_PER_SECOND) * 1000
	const start = usesShortName ? SHORT_HOLD + FADE : 0
	const scrollStart = start + FULL_HOLD
	const scrollEnd = scrollStart + travel
	const fadeStart = scrollEnd + FULL_HOLD
	const fadeEnd = fadeStart + FADE
	const duration = fadeEnd + (usesShortName ? 0 : FADE)
	const offset = (time: number) => time / duration
	const endTransform = `translateX(-${distance}px)`
	const fullOpacity = usesShortName ? 0 : 1
	const compactOffset = usesShortName ? (fullWidth - compactWidth) / 2 : 0
	const compactTransform = `translateX(${compactOffset}px)`
	if (logoTarget && animatedLayout) {
		animations.push(
			logoTarget.animate(
				[
					{ offset: 0, transform: compactTransform },
					{
						offset: offset(usesShortName ? SHORT_HOLD : 0),
						transform: compactTransform,
						easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
					},
					{ offset: offset(start), transform: 'translateX(0)' },
					{
						offset: offset(fadeStart),
						transform: 'translateX(0)',
						easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
					},
					{ offset: 1, transform: compactTransform },
				],
				{ duration, iterations: Infinity, easing: 'linear' },
			),
		)
	}
	animations.push(
		fullText.animate(
			[
				{ offset: 0, opacity: fullOpacity, transform: compactTransform },
				{
					offset: offset(usesShortName ? SHORT_HOLD : 0),
					opacity: fullOpacity,
					transform: compactTransform,
					easing: 'ease-in-out',
				},
				{ offset: offset(start), opacity: 1, transform: 'translateX(0)' },
				{ offset: offset(scrollStart), opacity: 1, transform: 'translateX(0)' },
				{ offset: offset(scrollEnd), opacity: 1, transform: endTransform },
				{
					offset: offset(fadeStart),
					opacity: 1,
					transform: endTransform,
					easing: 'ease-in-out',
				},
				{
					offset: offset(fadeEnd),
					opacity: 0,
					transform: `translateX(${compactOffset - distance}px)`,
				},
				...(usesShortName
					? []
					: [
							{
								offset: offset(fadeEnd),
								opacity: 0,
								transform: 'translateX(0)',
								easing: 'ease-in-out',
							},
							{ offset: 1, opacity: 1, transform: 'translateX(0)' },
						]),
			],
			{ duration, iterations: Infinity, easing: 'linear' },
		),
	)

	if (usesShortName && shortText) {
		animations.push(
			shortText.animate(
				[
					{ offset: 0, opacity: 1 },
					{ offset: offset(SHORT_HOLD), opacity: 1, easing: 'ease-in-out' },
					{ offset: offset(start), opacity: 0 },
					{ offset: offset(fadeStart), opacity: 0, easing: 'ease-in-out' },
					{ offset: 1, opacity: 1 },
				],
				{ duration, iterations: Infinity, easing: 'linear' },
			),
		)
	}
	return animations
}
