import { readFile } from 'node:fs/promises'
import sharp from 'sharp'
import type { CardAppearanceProfile } from '../../shared/types/card-appearance.ts'

// 使用显示尺度而非原图尺度；客户端按单元格宽度同比缩放 blur。
export const SAMPLE_SIZE = 48
const BLURS = [0, 0.35, 0.5, 0.75, 1, 1.5, 2, 2.5, 3]
const WEIGHTS = [0.2126, 0.7152, 0.0722]
interface Palette {
	light: { background: string; foreground: string }
	dark: { background: string; foreground: string }
}

export async function readAppearancePalette(file: string): Promise<Palette> {
	const css = await readFile(file, 'utf8')
	const value = (text: string, name: string) => {
		const result = text.match(new RegExp(`--${name}:\\s*([^;]+);`))?.[1]?.trim()
		if (!result)
			throw new Error(
				`Missing color token for card appearance analysis: ${name}`,
			)
		return result
	}
	const root = css.slice(css.indexOf(':root {'), css.indexOf('\n\t.dark {'))
	const dark = css.slice(css.indexOf('\n\t.dark {'))
	const surface = (text: string) =>
		`hsl(${value(root, 'color-primary__h')} ${value(text, 'color-surface-0__s')} ${value(text, 'color-surface-0__l')})`
	return {
		light: {
			background: surface(root),
			foreground: value(css, 'color-neutral-500'),
		},
		dark: {
			background: surface(dark),
			foreground: value(css, 'color-neutral-400'),
		},
	}
}

function edgeEnergy(data: Uint8Array, width: number, height: number): number {
	let sum = 0
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const i = (y * width + x) * 3
			for (const offset of [
				x + 1 < width ? 3 : 0,
				y + 1 < height ? width * 3 : 0,
			]) {
				if (!offset) continue
				for (let c = 0; c < 3; c++)
					sum +=
						WEIGHTS[c]! * ((data[i + c]! - data[i + offset + c]!) / 255) ** 2
			}
		}
	}
	return Math.sqrt(sum / (width * height))
}

export async function analyzeCardMaterial(
	input: Buffer,
	palette: Palette,
	options: { svg?: boolean; fit?: 'contain' | 'cover' } = {},
): Promise<CardAppearanceProfile> {
	if (((await sharp(input).metadata()).pages ?? 1) > 1)
		throw new Error('Card appearance analysis does not support animated images')
	const analyzeTheme = async (theme: 'light' | 'dark') => {
		const colors = palette[theme]
		const source = options.svg
			? Buffer.from(
					input
						.toString()
						.replaceAll('currentColor', colors.foreground)
						.replaceAll('__ID__', 'sample'),
				)
			: input
		const tile = await sharp(source)
			.autoOrient()
			.resize(42, 42, { fit: options.fit ?? 'cover', background: '#0000' })
			.png()
			.toBuffer()
		// 同浏览器 saturate(1.15)，在 sRGB 中计算，保留色彩差异。
		const { data: rgba } = await sharp(tile)
			.ensureAlpha()
			.raw()
			.toBuffer({ resolveWithObject: true })
		for (let i = 0; i < rgba.length; i += 4) {
			const luminance = WEIGHTS.reduce(
				(sum, weight, c) => sum + weight * rgba[i + c]!,
				0,
			)
			for (let c = 0; c < 3; c++)
				rgba[i + c] = Math.max(
					0,
					Math.min(
						255,
						Math.round(luminance + 1.15 * (rgba[i + c]! - luminance)),
					),
				)
		}
		const base = await sharp({
			create: {
				width: SAMPLE_SIZE,
				height: SAMPLE_SIZE,
				channels: 3,
				background: colors.background,
			},
		})
			.raw()
			.toBuffer()
		const composed = await sharp(base, {
			raw: { width: SAMPLE_SIZE, height: SAMPLE_SIZE, channels: 3 },
		})
			.composite([
				{
					input: await sharp(rgba, {
						raw: { width: 42, height: 42, channels: 4 },
					})
						.png()
						.toBuffer(),
					left: 3,
					top: 3,
				},
			])
			.removeAlpha()
			.raw()
			.toBuffer()
		const originalEnergy = edgeEnergy(composed, SAMPLE_SIZE, SAMPLE_SIZE)
		return Promise.all(
			BLURS.map(async (blur) => {
				let pipeline = sharp(composed, {
					raw: { width: SAMPLE_SIZE, height: SAMPLE_SIZE, channels: 3 },
				})
				if (blur > 0)
					pipeline = pipeline.blur({
						sigma: blur,
						precision: 'float',
						minAmplitude: 0.01,
					})
				const data = await pipeline.raw().toBuffer()
				let sum = 0
				for (let i = 0; i < data.length; i++)
					sum += WEIGHTS[i % 3]! * ((data[i]! - base[i]!) / 255) ** 2
				return {
					blur,
					contrast: Math.sqrt(sum / (SAMPLE_SIZE * SAMPLE_SIZE)),
					edgeRetention:
						originalEnergy > 1e-6
							? edgeEnergy(data, SAMPLE_SIZE, SAMPLE_SIZE) / originalEnergy
							: 1,
				}
			}),
		)
	}
	return {
		light: await analyzeTheme('light'),
		dark: await analyzeTheme('dark'),
	}
}
