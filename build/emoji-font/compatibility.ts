// Firefox's Windows/macOS font backends do not accept CBDT/CBLC-only fonts.
// Convert the same PNGs to a separate OpenType SVG font.
export function createSvgFontXml(xml: string): string {
	const glyphs = [...xml.matchAll(/<GlyphID id="(\d+)" name="([^"]+)"/g)]
	const glyphIds = new Map(glyphs.map((match) => [match[2]!, Number(match[1])]))
	const unitsPerEm = Number(xml.match(/<unitsPerEm value="(\d+)"/)?.[1])
	const strikes = [...xml.matchAll(/<strike index="\d+">/g)]
	const ppemX = Number(xml.match(/<ppemX value="(\d+)"/)?.[1])
	const ppemY = Number(xml.match(/<ppemY value="(\d+)"/)?.[1])
	// The pinned source has one strike, with PNGs and inline small metrics.
	// Reject a different source layout rather than silently dropping glyphs.
	if (
		!glyphs.length ||
		strikes.length !== 1 ||
		!unitsPerEm ||
		!ppemX ||
		!ppemY ||
		/<cbdt_bitmap_format_(?!17\b)/.test(xml) ||
		/<(?:glyf|SVG)>/.test(xml)
	) {
		throw new Error('EMOJI_FONT_UNSUPPORTED_SVG_SOURCE_LAYOUT')
	}
	const documents = [
		...xml.matchAll(
			/<cbdt_bitmap_format_17 name="([^"]+)">([\s\S]*?)<\/cbdt_bitmap_format_17>/g,
		),
	].map((match) => {
		const id = glyphIds.get(match[1]!)
		const bitmap = match[2]!
		const metric = (name: string) => {
			const value = bitmap.match(new RegExp(`<${name} value="(-?\\d+)"`))
			if (!value) throw new Error('EMOJI_FONT_BITMAP_METRICS_MISSING')
			return Number(value[1])
		}
		const hex = bitmap
			.match(/<rawimagedata>([\s\S]*?)<\/rawimagedata>/)?.[1]
			?.replace(/\s/g, '')
		if (id === undefined || !hex || !hex.startsWith('89504e470d0a1a0a'))
			throw new Error('EMOJI_FONT_BITMAP_PNG_MISSING')
		const png = Buffer.from(hex, 'hex').toString('base64')
		const scaleX = unitsPerEm / ppemX
		const scaleY = unitsPerEm / ppemY
		// SVG uses a downward Y axis; bitmap BearingY is measured upwards.
		const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1"><image id="glyph${id}" x="${metric('BearingX') * scaleX}" y="${-metric('BearingY') * scaleY}" width="${metric('width') * scaleX}" height="${metric('height') * scaleY}" xlink:href="data:image/png;base64,${png}"/></svg>`
		return `<svgDoc startGlyphID="${id}" endGlyphID="${id}" compressed="1"><![CDATA[${svg}]]></svgDoc>`
	})
	if (!documents.length) throw new Error('EMOJI_FONT_COLOR_DATA_MISSING')
	// OpenType SVG requires glyf/loca. Empty visible glyph outlines leave the
	// artwork to SVG; .notdef has an outline so OTS accepts the nonempty table.
	const outlines = glyphs.map((match) => {
		const name = match[2]!
		if (name !== '.notdef') return `<TTGlyph name="${name}"/>`
		return `<TTGlyph name=".notdef" xMin="0" yMin="0" xMax="1000" yMax="1000"><contour><pt x="0" y="0" on="1"/><pt x="0" y="1000" on="1"/><pt x="1000" y="1000" on="1"/><pt x="1000" y="0" on="1"/></contour><contour><pt x="100" y="100" on="1"/><pt x="900" y="100" on="1"/><pt x="900" y="900" on="1"/><pt x="100" y="900" on="1"/></contour><instructions/></TTGlyph>`
	})
	return xml
		.replace(/\s*<(CBDT|CBLC)>[\s\S]*?<\/\1>/g, '')
		.replace(
			'</ttFont>',
			`<glyf>${outlines.join('')}</glyf><loca/><SVG>${documents.join('')}</SVG></ttFont>`,
		)
}
