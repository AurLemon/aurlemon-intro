export interface CardAppearanceSample {
	blur: number
	contrast: number
	edgeRetention: number
}

export interface CardAppearanceProfile {
	light: readonly CardAppearanceSample[]
	dark: readonly CardAppearanceSample[]
}

export interface CardSvgMotif {
	id: string
	svg: string
}

export interface CardSvgMaterials {
	motifs: readonly CardSvgMotif[]
	profiles: Readonly<Record<string, CardAppearanceProfile>>
}
