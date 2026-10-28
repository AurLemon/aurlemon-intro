import { existsSync, readFileSync } from 'node:fs'
import { isAbsolute, resolve, sep } from 'node:path'
import { chromium } from 'playwright-core'

export interface FriendLinkBrowserManifest {
	platform: string
	arch: string
	playwrightVersion: string
	executablePath: string
}

export const getFriendLinkBrowserPath = (
	root = process.cwd(),
): string | null => {
	const configured = process.env.FRIEND_LINK_BROWSER_PATH?.trim()
	if (configured) {
		const path = resolve(root, configured)
		return existsSync(path) ? path : null
	}

	const browserRoot = resolve(root, '.playwright')
	try {
		const manifest = JSON.parse(
			readFileSync(resolve(browserRoot, 'browser.json'), 'utf8'),
		) as FriendLinkBrowserManifest
		if (
			manifest.platform === process.platform &&
			manifest.arch === process.arch &&
			typeof manifest.executablePath === 'string' &&
			!isAbsolute(manifest.executablePath)
		) {
			const executable = resolve(browserRoot, manifest.executablePath)
			if (executable.startsWith(browserRoot + sep) && existsSync(executable))
				return executable
		}
	} catch {
		// Local development can use a system browser without a deployment bundle.
	}

	return (
		[
			'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
			'/usr/bin/chromium',
			'/usr/bin/chromium-browser',
			'/usr/bin/google-chrome',
			chromium.executablePath(),
		].find((path) => existsSync(path)) ?? null
	)
}
