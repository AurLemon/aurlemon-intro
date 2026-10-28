import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { getFriendLinkBrowserPath } from '../lib/friend-link-browser.ts'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(resolve(root, 'package.json'))
const manifest = JSON.parse(
	await readFile(resolve(root, '.playwright/browser.json'), 'utf8'),
)
if (
	manifest.platform !== process.platform ||
	manifest.arch !== process.arch ||
	manifest.playwrightVersion !== require('playwright-core/package.json').version
) {
	throw new Error(
		'DEPLOY_BROWSER_RUNTIME_MISMATCH: Chromium must match the server platform, architecture and Playwright version',
	)
}
if (process.getuid?.() === 0) {
	throw new Error(
		'DEPLOY_BROWSER_REQUIRES_NON_ROOT: run deployment and the PM2 application as the same non-root service user; Chromium sandbox remains enabled',
	)
}
const executablePath = getFriendLinkBrowserPath(root)
if (!executablePath)
	throw new Error(
		'DEPLOY_BROWSER_MISSING: Chromium is missing from the deployment bundle',
	)

const libraries = spawnSync('ldd', [executablePath], { encoding: 'utf8' })
const fonts = spawnSync('fc-list', [':lang=zh'], { encoding: 'utf8' })
if (
	libraries.error ||
	libraries.status !== 0 ||
	libraries.stdout.includes('not found') ||
	fonts.status !== 0 ||
	!fonts.stdout.trim()
) {
	if (!process.argv.includes('--install-deps')) {
		throw new Error(
			'DEPLOY_BROWSER_LIBRARIES_MISSING: Chromium system libraries or CJK fonts are unavailable',
		)
	}
	const permission = spawnSync('sudo', ['-n', 'true'], { stdio: 'ignore' })
	if (permission.status !== 0) {
		throw new Error(
			'DEPLOY_BROWSER_DEPENDENCY_PERMISSION_REQUIRED: missing system libraries or CJK fonts require non-interactive sudo for playwright-core install-deps chromium',
		)
	}
	const cli = resolve(
		require.resolve('playwright-core/package.json'),
		'..',
		'cli.js',
	)
	const install = spawnSync(
		'sudo',
		[
			'-n',
			'env',
			'DEBIAN_FRONTEND=noninteractive',
			process.execPath,
			cli,
			'install-deps',
			'chromium',
		],
		{
			stdio: 'inherit',
			env: { ...process.env, DEBIAN_FRONTEND: 'noninteractive' },
		},
	)
	if (install.status !== 0)
		throw new Error(
			'DEPLOY_BROWSER_DEPENDENCY_INSTALL_FAILED: Chromium system dependencies could not be installed',
		)
}
const { chromium } = require('playwright-core')
const browser = await chromium.launch({
	executablePath,
	headless: true,
	chromiumSandbox: true,
	timeout: 15_000,
})
try {
	const page = await browser.newPage()
	await page.goto('about:blank')
	const bytes = await page.screenshot({ timeout: 8_000 })
	const sharp = require('sharp')
	await sharp(bytes).webp().toBuffer()
	console.log(
		`DEPLOY_BROWSER_READY: Chromium ${browser.version()}, sandbox and WebP encoding verified`,
	)
} finally {
	await browser.close()
}
