import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import type { SiteBuildInfo } from '../shared/types/site-meta'

const root = fileURLToPath(new URL('../', import.meta.url))
const require = createRequire(new URL('../package.json', import.meta.url))

const resolveCommit = (): string => {
	// Archives without .git can explicitly supply the source commit at build time.
	const configured = process.env.SITE_COMMIT_SHA?.trim()
	if (configured) {
		if (!/^(?:[a-f\d]{40}|[a-f\d]{64})$/i.test(configured)) {
			throw new Error('SITE_COMMIT_SHA must be a full Git commit hash.')
		}
		return configured.toLowerCase()
	}
	try {
		return execFileSync('git', ['rev-parse', 'HEAD'], {
			cwd: root,
			encoding: 'utf8',
			stdio: ['ignore', 'pipe', 'ignore'],
		}).trim()
	} catch {
		return ''
	}
}

interface PackageMetadata {
	version: string
}

const resolveCommittedAt = (commit: string): string => {
	if (!commit) return ''
	try {
		const date = execFileSync('git', ['show', '-s', '--format=%cI', commit], {
			cwd: root,
			encoding: 'utf8',
			stdio: ['ignore', 'pipe', 'ignore'],
		}).trim()
		return new Date(date).toISOString()
	} catch {
		return ''
	}
}

const installedVersion = (name: string): string => {
	const path = fileURLToPath(
		new URL(`../node_modules/${name}/package.json`, import.meta.url),
	)
	return (JSON.parse(readFileSync(path, 'utf8')) as PackageMetadata).version
}

const commit = resolveCommit()

export const siteBuildInfo: SiteBuildInfo = {
	commit,
	committedAt: resolveCommittedAt(commit),
	dependencies: [
		...[
			'nuxt',
			'vue',
			'typescript',
			'@nuxt/ui',
			'@nuxt/content',
			'tailwindcss',
		].map((name) => ({
			name,
			version: installedVersion(name),
		})),
		{
			name: 'nitro',
			version: (
				createRequire(require.resolve('nuxt/package.json'))(
					'nitropack/package.json',
				) as PackageMetadata
			).version,
		},
	],
}
