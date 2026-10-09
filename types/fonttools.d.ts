declare module '@web-alchemy/fonttools' {
	interface FontTools {
		subset(
			font: Uint8Array,
			options: Record<string, string | boolean>,
		): Promise<Uint8Array>
		ttx(font: Uint8Array, options: string[][]): Promise<Uint8Array>
	}
	const fontTools: FontTools
	export default fontTools
}
