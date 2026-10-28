import { lookup } from 'node:dns/promises'
import { BlockList, isIP } from 'node:net'
import { chromium } from 'playwright-core'
import sharp from 'sharp'
import type { FriendLinkCoverVariant } from '~/shared/types/friend-link-cover'
import { getFriendLinkBrowserPath } from '~/lib/friend-link-browser'
export { getFriendLinkBrowserPath } from '~/lib/friend-link-browser'

const blocked = new BlockList()
for (const [address, prefix] of [
	['0.0.0.0', 8],
	['10.0.0.0', 8],
	['100.64.0.0', 10],
	['127.0.0.0', 8],
	['169.254.0.0', 16],
	['172.16.0.0', 12],
	['192.0.0.0', 24],
	['192.0.2.0', 24],
	['192.168.0.0', 16],
	['198.18.0.0', 15],
	['198.51.100.0', 24],
	['203.0.113.0', 24],
	['224.0.0.0', 3],
] as const)
	blocked.addSubnet(address, prefix, 'ipv4')
for (const [address, prefix] of [
	['::', 128],
	['::1', 128],
	['64:ff9b::', 96],
	['100::', 64],
	['2001::', 32],
	['2001:db8::', 32],
	['2002::', 16],
	['fc00::', 7],
	['fe80::', 10],
	['ff00::', 8],
] as const)
	blocked.addSubnet(address, prefix, 'ipv6')

// Check redirects and subresources as well as the approved site's initial URL.
export const assertPublicCaptureUrl = async (value: string): Promise<void> => {
	const url = new URL(value)
	if (
		!['http:', 'https:'].includes(url.protocol) ||
		url.username ||
		url.password ||
		(url.port && !['80', '443'].includes(url.port))
	) {
		throw new Error('Unsupported screenshot URL.')
	}
	const host = url.hostname.replace(/^\[|\]$/g, '')
	const addresses = isIP(host)
		? [{ address: host, family: isIP(host) }]
		: await lookup(host, { all: true })
	if (
		!addresses.length ||
		addresses.some(({ address, family }) =>
			blocked.check(address, family === 6 ? 'ipv6' : 'ipv4'),
		)
	) {
		throw new Error('Screenshot URL must resolve to a public address.')
	}
}

export const captureFriendLinkCover = async (
	url: string,
	variant: FriendLinkCoverVariant = 'desktop',
): Promise<Buffer> => {
	await assertPublicCaptureUrl(url)
	const executablePath = getFriendLinkBrowserPath()
	if (!executablePath) throw new Error('Screenshot browser is not configured.')
	const browser = await chromium.launch({
		executablePath,
		headless: true,
		chromiumSandbox: true,
		timeout: 15_000,
		...(process.env.FRIEND_LINK_SCREENSHOT_PROXY
			? { proxy: { server: process.env.FRIEND_LINK_SCREENSHOT_PROXY } }
			: {}),
	})
	const deadline = setTimeout(() => void browser.close(), 45_000)
	try {
		const context = await browser.newContext({
			viewport:
				variant === 'mobile'
					? { width: 390, height: 844 }
					: { width: 1440, height: 900 },
			...(variant === 'mobile'
				? {
						isMobile: true,
						hasTouch: true,
						userAgent: `Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${browser.version()} Mobile Safari/537.36`,
					}
				: {}),
			deviceScaleFactor: 1,
			colorScheme: 'light',
			reducedMotion: 'reduce',
			serviceWorkers: 'block',
			acceptDownloads: false,
		})
		const allowed = new Map<string, Promise<void>>()
		await context.route('**/*', async (route) => {
			try {
				const requestUrl = new URL(route.request().url())
				if (route.request().resourceType() === 'media')
					return await route.abort()
				const origin = requestUrl.origin
				if (!allowed.has(origin))
					allowed.set(origin, assertPublicCaptureUrl(requestUrl.href))
				await allowed.get(origin)
				await route.continue()
			} catch {
				await route.abort()
			}
		})
		await context.routeWebSocket('**/*', (socket) => socket.close())
		const page = await context.newPage()
		page.setDefaultTimeout(8_000)
		const response = await page.goto(url, {
			waitUntil: 'domcontentloaded',
			timeout: 25_000,
		})
		if (!response?.ok())
			throw new Error(
				`Screenshot navigation failed: ${response?.status() ?? 'no response'}.`,
			)
		// A zero-height body can still contain visible floated/positioned content.
		await page.waitForFunction(() => {
			if (!document.body) return false
			return [
				document.body,
				...document.body.querySelectorAll(
					'main, article, header, h1, h2, p, a, img, canvas, svg',
				),
			].some((element) => {
				const rect = element.getBoundingClientRect()
				return (
					rect.width > 0 &&
					rect.height > 0 &&
					rect.bottom > 0 &&
					rect.right > 0 &&
					rect.top < innerHeight &&
					rect.left < innerWidth &&
					element.checkVisibility({
						opacityProperty: true,
						visibilityProperty: true,
					})
				)
			})
		})
		await page.evaluate(() =>
			Promise.race([
				document.fonts.ready,
				new Promise((resolve) => setTimeout(resolve, 2500)),
			]),
		)
		await page.waitForTimeout(2200)
		// A visible navigation bar alone does not make a usable cover. In
		// particular, some sites leave their hero at near-zero opacity on errors.
		await page.waitForFunction(
			() => {
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
				return (
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
				)
			},
			undefined,
			{ timeout: 4_000 },
		)
		const title = await page.title()
		const text = await page.locator('body').innerText()
		if (
			/just a moment|attention required|security verification|checking your browser|访问验证|安全验证|人机验证|网站防火墙/i.test(
				title,
			) ||
			(/verify you are human|verifying your browser|请完成安全验证/i.test(
				text,
			) &&
				text.length < 2000) ||
			(!text.trim() && (await page.locator('img, canvas, svg').count()) === 0)
		) {
			throw new Error('Screenshot page is empty or requires verification.')
		}
		let bytes: Buffer
		try {
			bytes = await page.screenshot({
				type: 'png',
				animations: 'disabled',
				timeout: 8_000,
			})
		} catch (error) {
			// Some sites never finish loading web fonts. Capture the visible fallback
			// after the bounded wait instead of discarding an otherwise valid page.
			if (
				page.isClosed() ||
				(await page.evaluate(() => document.fonts.status === 'loaded'))
			)
				throw error
			const session = await context.newCDPSession(page)
			try {
				const screenshot = await session.send('Page.captureScreenshot', {
					format: 'png',
					captureBeyondViewport: false,
				})
				bytes = Buffer.from(screenshot.data, 'base64')
			} finally {
				await session.detach()
			}
		}
		return await sharp(bytes).webp({ quality: 78 }).toBuffer()
	} finally {
		clearTimeout(deadline)
		await browser.close()
	}
}
