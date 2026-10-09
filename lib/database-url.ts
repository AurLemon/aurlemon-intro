import { existsSync } from 'node:fs'
import { dirname, isAbsolute, resolve } from 'node:path'

const PRISMA_SCHEMA_PATH = resolve(process.cwd(), 'prisma/schema.prisma')
const SQLITE_RELATIVE_BASE_DIR = existsSync(PRISMA_SCHEMA_PATH)
	? dirname(PRISMA_SCHEMA_PATH)
	: process.cwd()

const resolveSqliteRelativePath = (dbPath: string): string =>
	resolve(SQLITE_RELATIVE_BASE_DIR, dbPath)

export const resolveSqliteDatabaseUrl = (
	url = process.env.DATABASE_URL ?? 'file:./dev.db',
): string => {
	if (!url.startsWith('file:')) {
		return url
	}

	const dbPath = url.slice('file:'.length)

	if (isAbsolute(dbPath)) {
		return url
	}

	return `file:${resolveSqliteRelativePath(dbPath)}`
}
