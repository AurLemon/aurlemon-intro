import { mkdir, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { relative, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const root = resolve(process.argv[2] ?? 'deploy-artifact')
if (process.platform !== 'linux') {
	throw new Error(
		'DEPLOY_BROWSER_PLATFORM_UNSUPPORTED: build the deployment browser on Linux',
	)
}
const browserRoot = resolve(root, '.playwright')
await mkdir(browserRoot, { recursive: true })
process.env.PLAYWRIGHT_BROWSERS_PATH = browserRoot
const require = createRequire(resolve(root, 'package.json'))
const packagePath = require.resolve('playwright-core/package.json')
const cli = resolve(packagePath, '..', 'cli.js')
const install = spawnSync(
	process.execPath,
	[cli, 'install', '--with-deps', '--no-shell', 'chromium'],
	{
		stdio: 'inherit',
		env: { ...process.env, DEBIAN_FRONTEND: 'noninteractive' },
	},
)
if (install.status !== 0) {
	throw new Error('DEPLOY_BROWSER_INSTALL_FAILED: unable to prepare Chromium')
}
const { chromium } = require('playwright-core')
const executablePath = chromium.executablePath()
const manifest = {
	platform: process.platform,
	arch: process.arch,
	playwrightVersion: require('playwright-core/package.json').version,
	executablePath: relative(browserRoot, executablePath),
}
await writeFile(
	resolve(browserRoot, 'browser.json'),
	JSON.stringify(manifest, null, 2) + '\n',
)
// The build container checks only a trusted blank page. Production preflight
// separately requires sandbox support under the actual application user.
const browser = await chromium.launch({
	executablePath,
	headless: true,
	timeout: 15_000,
})
try {
	const page = await browser.newPage()
	await page.goto('about:blank')
	await page.screenshot({ timeout: 8_000 })
} finally {
	await browser.close()
}
console.log(
	`DEPLOY_BROWSER_BUNDLED: Chromium ${browser.version()} (${manifest.platform}/${manifest.arch})`,
)
