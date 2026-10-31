import type { Page, Request } from 'playwright-core'

interface ViewportReadiness {
	headingReady: boolean
	signature: string | null
}

interface CaptureReadiness {
	wait: (timeoutMs: number) => Promise<void>
	dispose: () => void
}

// Start observing before navigation so even requests begun during parsing are
// included. Viewport images and CSS backgrounds are checked by decoding;
// off-DOM canvas textures must not keep a dynamic map capture pending forever.
// Fonts retain their separate bounded wait and screenshot fallback.
export const observeFriendLinkCaptureReadiness = (
	page: Page,
): CaptureReadiness => {
	const pending = new Set<Request>()
	let lastActivity = Date.now()
	const onRequest = (request: Request) => {
		if (
			['image', 'font', 'media', 'websocket', 'eventsource', 'ping'].includes(
				request.resourceType(),
			)
		)
			return
		pending.add(request)
		lastActivity = Date.now()
	}
	const onFinished = (request: Request) => {
		if (pending.delete(request)) lastActivity = Date.now()
	}
	page.on('request', onRequest)
	page.on('requestfinished', onFinished)
	page.on('requestfailed', onFinished)

	return {
		async wait(timeoutMs) {
			if (timeoutMs <= 0)
				throw new Error('Screenshot deadline exceeded before resource wait.')
			const startedAt = Date.now()
			let previousImages: string | null = null
			let lastState: ViewportReadiness = { headingReady: true, signature: null }
			let stableSince = startedAt
			const backgrounds = await page.evaluateHandle(
				() => new Map<string, HTMLImageElement>(),
			)
			try {
				while (Date.now() - startedAt < timeoutMs) {
					const state = await page.evaluate(async (backgrounds) => {
						const headings = [...document.querySelectorAll('h1')].filter(
							(element) => {
								const rect = element.getBoundingClientRect()
								return (
									rect.width > 20 &&
									rect.height > 10 &&
									rect.top < innerHeight &&
									rect.bottom > 0
								)
							},
						)

						const headingReady =
							!headings.length ||
							headings.some((element) => {
								let opacity = 1
								for (
									let parent: Element | null = element;
									parent;
									parent = parent.parentElement
								) {
									opacity *= Number(getComputedStyle(parent).opacity)
								}
								return (
									opacity >= 0.1 &&
									element.checkVisibility({ visibilityProperty: true })
								)
							})
						if (!headingReady) return { headingReady, signature: null }

						const visible = [...document.images].filter((image) => {
							const rect = image.getBoundingClientRect()
							return (
								rect.width > 1 &&
								rect.height > 1 &&
								rect.bottom > 0 &&
								rect.right > 0 &&
								rect.top < innerHeight &&
								rect.left < innerWidth &&
								image.checkVisibility({ visibilityProperty: true }) &&
								(image.currentSrc ||
									image.getAttribute('src') ||
									image.getAttribute('srcset') ||
									image.dataset.src)
							)
						})
						// Only the first viewport is captured. Wake native lazy images in
						// that viewport without scrolling or altering custom loader URLs.
						for (const image of visible) {
							if (image.loading === 'lazy') image.loading = 'eager'
						}
						const backgroundUrls = new Set<string>()
						for (const element of document.querySelectorAll(
							'html, body, body *',
						)) {
							if (!(element instanceof HTMLElement)) continue
							const rect = element.getBoundingClientRect()
							if (
								rect.width <= 1 ||
								rect.height <= 1 ||
								rect.bottom <= 0 ||
								rect.right <= 0 ||
								rect.top >= innerHeight ||
								rect.left >= innerWidth ||
								!element.checkVisibility({ visibilityProperty: true })
							)
								continue
							for (const pseudo of [null, '::before', '::after']) {
								const background = getComputedStyle(
									element,
									pseudo,
								).backgroundImage
								for (const match of background.matchAll(
									/url\((?:"([^"]*)"|'([^']*)'|([^)]*))\)/g,
								)) {
									const url = new URL(
										match[1] ?? match[2] ?? match[3]!,
										document.baseURI,
									).href
									backgroundUrls.add(url)
									if (!backgrounds.has(url)) {
										const image = new Image()
										backgrounds.set(url, image)
										image.src = url
									}
								}
							}
						}
						const required = [
							...visible,
							...[...backgroundUrls].map((url) => backgrounds.get(url)!),
						]
						if (
							required.some(
								(image) => !image.complete || image.naturalWidth === 0,
							)
						)
							return { headingReady, signature: null }
						const decoded = await Promise.race([
							Promise.all(
								required.map((image) =>
									image.decode().then(
										() => true,
										() => false,
									),
								),
							),
							new Promise<false>((resolve) =>
								setTimeout(() => resolve(false), 250),
							),
						])
						if (!decoded || decoded.some((ready) => !ready))
							return { headingReady, signature: null }
						return {
							headingReady,
							signature: JSON.stringify({
								images: visible.map((image) => [
									image.currentSrc,
									image.naturalWidth,
									image.naturalHeight,
								]),
								backgrounds: [...backgroundUrls].sort(),
							}),
						}
					}, backgrounds)
					lastState = state
					const images = state.signature
					const now = Date.now()
					if (images === null || images !== previousImages || pending.size)
						stableSince = now
					previousImages = images
					if (
						images !== null &&
						pending.size === 0 &&
						now - Math.max(stableSince, lastActivity) >= 1500 &&
						now - startedAt >= 2200
					)
						return
					await page.waitForTimeout(200)
				}
				if (!lastState.headingReady)
					throw new Error('Screenshot main heading is still hidden.')
				// Continuous widgets and broken optional resources are best effort;
				// capture the valid current page after the bounded observation window.
				console.warn('FRIEND_LINK_COVER_RESOURCES_PENDING', {
					origin: new URL(page.url()).origin,
					pendingRequests: pending.size,
					viewportImagesReady: lastState.signature !== null,
				})
			} finally {
				await backgrounds.dispose()
			}
		},
		dispose() {
			page.off('request', onRequest)
			page.off('requestfinished', onFinished)
			page.off('requestfailed', onFinished)
		},
	}
}
