import type { CardPatternSettings } from '~/components/cards/cardPattern'

interface PatternPlaneSize {
	columns: number
	rows: number
}
interface PatternPosition {
	motif: string
	x: number
	y: number
}
interface PatternBounds {
	width: number
	height: number
}
interface PatternLayoutOptions {
	background: Ref<HTMLElement | null>
	motifs: Ref<readonly string[]>
	settings: Ref<CardPatternSettings>
	staticMode: Ref<boolean>
}

export const useCardPatternLayout = ({
	background,
	motifs,
	settings,
	staticMode,
}: PatternLayoutOptions) => {
	const planeSize = ref<PatternPlaneSize>({ columns: 12, rows: 8 })
	const tileRows = computed(() =>
		Math.max(
			1,
			settings.value.layout === 'catalog'
				? Math.ceil(motifs.value.length / 4)
				: motifs.value.length,
		),
	)
	const tileColumns = computed(() =>
		settings.value.layout === 'catalog'
			? 4
			: tileRows.value % 2 === 0
				? tileRows.value
				: tileRows.value * 2,
	)
	const positions = computed<PatternPosition[]>(() =>
		motifs.value.flatMap((motif, motifIndex) => {
			const entries: PatternPosition[] = []
			const add = (column: number, row: number) => {
				const x =
					column * settings.value.columnStep +
					(settings.value.columnStep - 0.88) / 2
				const y =
					(row + (column % 2 ? 0.5 : 0)) * settings.value.rowStep +
					(settings.value.rowStep - 0.88) / 2
				entries.push({ x, y, motif })
				if (y + 0.88 > tileRows.value * settings.value.rowStep)
					entries.push({
						x,
						y: y - tileRows.value * settings.value.rowStep,
						motif,
					})
			}
			for (let column = 0; column < tileColumns.value; column++) {
				if (settings.value.layout === 'catalog') {
					for (let row = 0; row < tileRows.value; row++)
						if (
							(row * tileColumns.value + column) % motifs.value.length ===
							motifIndex
						)
							add(column, row)
				} else
					add(
						column,
						(motifIndex - (column % tileRows.value) + tileRows.value) %
							tileRows.value,
					)
			}
			return entries
		}),
	)
	let bounds: PatternBounds | undefined
	let observer: ResizeObserver | undefined
	const measure = () => {
		if (!bounds) return
		const { width, height } = bounds
		const step =
			Math.max(36, Math.min(64, width * 0.14)) / settings.value.density
		const angle = Math.PI / 15
		// 静态模式只留旋转与滤镜余量；桌面保留原有完整循环高度。
		const driftRows = staticMode.value
			? 0
			: 2 * tileRows.value * settings.value.rowStep
		const next = {
			columns: Math.ceil(
				(width * Math.cos(angle) + height * Math.sin(angle)) / step + 1,
			),
			rows: Math.ceil(
				(height * Math.cos(angle) + width * Math.sin(angle)) / step +
					driftRows +
					1,
			),
		}
		if (
			next.columns !== planeSize.value.columns ||
			next.rows !== planeSize.value.rows
		)
			planeSize.value = next
	}
	watch([staticMode, settings, tileRows], measure)
	onMounted(() => {
		observer = new ResizeObserver(([entry]) => {
			if (!entry) return
			bounds = {
				width: entry.contentRect.width,
				height: entry.contentRect.height,
			}
			measure()
		})
		if (background.value) observer.observe(background.value)
	})
	onBeforeUnmount(() => observer?.disconnect())
	return { planeSize, tileRows, tileColumns, positions }
}
