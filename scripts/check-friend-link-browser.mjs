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

function checkDependencies() {
	const libraries = spawnSync('ldd', [executablePath], { encoding: 'utf8' })
	const fonts = spawnSync('fc-list', [':lang=zh'], { encoding: 'utf8' })
	const issues = []
	if (libraries.error || libraries.status !== 0) {
		issues.push(
			`ldd failed: ${libraries.error?.message ?? libraries.stderr.trim()}`,
		)
	} else {
		issues.push(
			...libraries.stdout
				.split('\n')
				.filter((line) => line.includes('not found'))
				.map((line) => line.trim()),
		)
	}
	const fontsMissing = fonts.status !== 0 || !fonts.stdout?.trim()
	if (fontsMissing) issues.push('fontconfig or Chinese fonts are unavailable')
	return { issues, fontsMissing }
}

function installSystemPackages(args) {
	const install = spawnSync(
		'sudo',
		['-n', 'env', 'DEBIAN_FRONTEND=noninteractive', ...args],
		{
			stdio: 'inherit',
			env: { ...process.env, DEBIAN_FRONTEND: 'noninteractive' },
		},
	)
	if (install.error || install.status !== 0) {
		const version = require('playwright-core/package.json').version
		console.error(
			'DEPLOY_BROWSER_ADMIN_SETUP_REQUIRED: run these commands in a root shell with Node.js and pnpm, then retry deployment:',
		)
		console.error(`pnpm dlx playwright-core@${version} install-deps chromium`)
		console.error(
			'apt-get update && apt-get install -y --no-install-recommends fontconfig fonts-noto-cjk',
		)
		throw new Error(
			`DEPLOY_BROWSER_DEPENDENCY_INSTALL_FAILED: ${install.error?.message ?? `installer exited with status ${install.status}`}; automatic installation requires non-interactive sudo for the installation commands`,
		)
	}
}

let dependencies = checkDependencies()
if (dependencies.issues.length) {
	console.error(
		`DEPLOY_BROWSER_DEPENDENCIES_MISSING:\n${dependencies.issues.join('\n')}`,
	)
	if (!process.argv.includes('--install-deps')) {
		throw new Error(
			'DEPLOY_BROWSER_LIBRARIES_MISSING: Chromium system libraries or CJK fonts are unavailable',
		)
	}
	const cli = resolve(
		require.resolve('playwright-core/package.json'),
		'..',
		'cli.js',
	)
	installSystemPackages([process.execPath, cli, 'install-deps', 'chromium'])
	dependencies = checkDependencies()
	if (dependencies.fontsMissing) {
		installSystemPackages(['apt-get', 'update'])
		installSystemPackages([
			'apt-get',
			'install',
			'-y',
			'--no-install-recommends',
			'fontconfig',
			'fonts-noto-cjk',
		])
		dependencies = checkDependencies()
	}
	if (dependencies.issues.length)
		throw new Error(
			`DEPLOY_BROWSER_DEPENDENCIES_UNRESOLVED: ${dependencies.issues.join('; ')}`,
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
