import type {
	CardAppearanceProfile,
	CardAppearanceSample,
} from '~/shared/types/card-appearance'

export const CARD_PATTERN_DRIFT_START_MS = 480

export interface CardPatternTheme {
	visibility: number
	activeVisibility: number
	blur: number
	activeBlur: number
}

export interface CardPatternShadow {
	dx: number
	dy: number
	blur: number
	opacity: number
}

export type CardBlurLevel = 'clear' | 'standard' | 'soft'
export type CardStrengthLevel = 'quiet' | 'subtle' | 'standard' | 'distinct'

export const CARD_BLUR_LEVELS: Record<CardBlurLevel, number> = {
	clear: 0.65,
	standard: 1,
	soft: 1.15,
}
export const CARD_STRENGTH_LEVELS: Record<CardStrengthLevel, number> = {
	quiet: 0.5,
	subtle: 0.8,
	standard: 1,
	distinct: 1.2,
}

export interface CardPatternOptions {
	layout?: 'diagonal' | 'catalog'
	driftSecondsPerRow?: number
	columnStep?: number
	rowStep?: number
	density?: number
	blurLevel?: CardBlurLevel
	strengthLevel?: CardStrengthLevel
	light?: Partial<CardPatternTheme>
	dark?: Partial<CardPatternTheme>
	shadow?: Partial<CardPatternShadow>
	transitionMs?: number
}

export interface CardPatternSettings {
	layout: 'diagonal' | 'catalog'
	driftSecondsPerRow: number
	columnStep: number
	rowStep: number
	density: number
	light: CardPatternTheme
	dark: CardPatternTheme
	shadow: CardPatternShadow
	transitionMs: number
}

export const CARD_PATTERN_DEFAULTS: Readonly<CardPatternSettings> = {
	layout: 'diagonal',
	driftSecondsPerRow: 5,
	columnStep: 1,
	rowStep: 1,
	density: 0.8,
	light: {
		visibility: 0.036,
		activeVisibility: 0.075,
		blur: 3,
		activeBlur: 1.5,
	},
	dark: {
		visibility: 0.057,
		activeVisibility: 0.0762,
		blur: 3,
		activeBlur: 1.5,
	},
	shadow: { dx: 0, dy: 0.025, blur: 0.022, opacity: 0.55 },
	transitionMs: 500,
}

// 统一约束；可见度不是 CSS opacity，而是相对主题底色的 RMS 色差。
export const CARD_APPEARANCE_LIMITS = {
	maxOpacity: 0.6,
}

// blur 的公共配置以 64px 单元格为基准；采样表基于 48px 单元格。
export const CARD_PATTERN_REFERENCE_SIZE = 64
export const CARD_APPEARANCE_SAMPLE_SIZE = 48

export function sampleCardContrast(
	samples: readonly CardAppearanceSample[],
	blur: number,
): number {
	const upperIndex = samples.findIndex((sample) => sample.blur >= blur)
	if (upperIndex < 0) return samples.at(-1)?.contrast ?? 0
	const upper = samples[upperIndex]!
	const lower = samples[Math.max(0, upperIndex - 1)]!
	if (upper.blur === lower.blur) return upper.contrast
	const weight = (blur - lower.blur) / (upper.blur - lower.blur)
	return lower.contrast + (upper.contrast - lower.contrast) * weight
}

export function calculateCardOpacity(
	contrast: number,
	visibility: number,
): number {
	if (!Number.isFinite(contrast) || contrast <= 1e-6) return 0
	return Math.max(
		0,
		Math.min(CARD_APPEARANCE_LIMITS.maxOpacity, visibility / contrast),
	)
}

export function calculateCardAppearance(
	profile: CardAppearanceProfile | undefined,
	theme: 'light' | 'dark',
	settings: CardPatternTheme,
	blur: number,
	activeBlur: number,
) {
	const samples = profile?.[theme] ?? []
	const contrastAt = (value: number) => sampleCardContrast(samples, value)
	return {
		opacity: calculateCardOpacity(contrastAt(blur), settings.visibility),
		activeOpacity: calculateCardOpacity(
			contrastAt(activeBlur),
			settings.activeVisibility,
		),
	}
}

export function resolveCardPatternSettings(
	options: CardPatternOptions,
): CardPatternSettings {
	const settings: CardPatternSettings = {
		layout: options.layout ?? CARD_PATTERN_DEFAULTS.layout,
		driftSecondsPerRow:
			options.driftSecondsPerRow ?? CARD_PATTERN_DEFAULTS.driftSecondsPerRow,
		columnStep: options.columnStep ?? CARD_PATTERN_DEFAULTS.columnStep,
		rowStep: options.rowStep ?? CARD_PATTERN_DEFAULTS.rowStep,
		density: options.density ?? CARD_PATTERN_DEFAULTS.density,
		light: {
			...CARD_PATTERN_DEFAULTS.light,
			...options.light,
		},
		dark: {
			...CARD_PATTERN_DEFAULTS.dark,
			...options.dark,
		},
		shadow: { ...CARD_PATTERN_DEFAULTS.shadow, ...options.shadow },
		transitionMs: options.transitionMs ?? CARD_PATTERN_DEFAULTS.transitionMs,
	}
	const blurFactor = CARD_BLUR_LEVELS[options.blurLevel ?? 'standard']
	const strengthFactor =
		CARD_STRENGTH_LEVELS[options.strengthLevel ?? 'standard']
	for (const theme of ['light', 'dark'] as const) {
		const values = settings[theme]
		values.blur *= blurFactor
		values.activeBlur *= blurFactor
		values.visibility *= strengthFactor
		values.activeVisibility *= strengthFactor
	}
	return settings
}
