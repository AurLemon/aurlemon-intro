declare module '*.card-motifs.json?appearance' {
	const materials: import('../shared/types/card-appearance').CardSvgMaterials
	export default materials
}
declare module '*.webp?appearance' {
	const profile: import('../shared/types/card-appearance').CardAppearanceProfile
	export default profile
}
