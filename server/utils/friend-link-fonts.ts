import type { Page } from 'playwright-core'

interface CaptureFontStylesheet {
	css: string
	imports: string[]
}

let stylesheet: Promise<CaptureFontStylesheet> | undefined

// Read the same font declarations and sans stack as the site. Local faces are
// embedded so a deployed capture never depends on source files or localhost.
const getCaptureFontStylesheet = (): Promise<CaptureFontStylesheet> => {
	stylesheet ??= (async () => {
		const assets = useStorage('assets')
		const base = await assets.getItem<string>('capture-styles:base/main.css')
		const stack = base?.match(/--font-sans:\s*([^;]+);/)?.[1]
		if (!stack) throw new Error('Screenshot default font stack is missing.')
		const imports: string[] = []
		const faces: string[] = []
		for (const name of ['misans', 'rubik', 'noto-sans']) {
			const source = await assets.getItem<string>(
				`capture-styles:fonts/${name}.css`,
			)
			if (!source) throw new Error(`Screenshot font CSS is missing: ${name}.`)
			let css = source.replace(
				/@import\s+url\((['"])(.*?)\1\)\s*;/g,
				(rule) => {
					const url = rule.match(/url\(['"]([^'"]+)['"]\)/)?.[1]
					if (url) imports.push(url)
					return ''
				},
			)
			for (const match of css.matchAll(
				/url\(['"]?\.\.\/\.\.\/fonts\/([^'")]+)['"]?\)/g,
			)) {
				const bytes = await assets.getItemRaw<Buffer>(
					`capture-fonts:${match[1]}`,
				)
				if (!bytes)
					throw new Error(`Screenshot font file is missing: ${match[1]}.`)
				css = css.replace(
					match[0],
					`url("data:font/woff2;base64,${Buffer.from(bytes).toString('base64')}")`,
				)
			}
			faces.push(css)
		}
		// Keep destination font-sans definitions and component typography;
		// supply the default font on the document and body only.
		return {
			imports,
			css: `${faces.join('\n')}\n:where(:root) { --font-sans: ${stack}; }\nhtml, body { font-family: var(--font-sans); }`,
		}
	})().catch((error) => {
		stylesheet = undefined
		throw error
	})
	return stylesheet
}

export const applyFriendLinkCaptureFonts = async (
	page: Page,
): Promise<void> => {
	const stylesheet = await getCaptureFontStylesheet()
	// Insert synchronously: external font stylesheets may keep loading beyond
	// our bounded font wait, so do not wait for the style element's load event.
	await page.evaluate(({ css, imports }) => {
		const style = document.createElement('style')
		style.textContent = css
		document.head.append(style)
		for (const href of imports) {
			const link = document.createElement('link')
			link.rel = 'stylesheet'
			link.href = href
			document.head.append(link)
		}
	}, stylesheet)
}
