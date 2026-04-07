import { PrismaClient } from '@prisma/client'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const PRISMA_SCHEMA_PATH = resolve(process.cwd(), 'prisma/schema.prisma')
const SQLITE_RELATIVE_BASE_DIR = existsSync(PRISMA_SCHEMA_PATH)
	? dirname(PRISMA_SCHEMA_PATH)
	: process.cwd()

const resolveSqliteRelativePath = (dbPath: string): string =>
	resolve(SQLITE_RELATIVE_BASE_DIR, dbPath)

const normalizeSqliteUrl = (url: string | undefined): string | undefined => {
	if (!url?.startsWith('file:')) {
		return url
	}

	const dbPath = url.slice('file:'.length)

	if (dbPath.startsWith('/')) {
		return url
	}

	return `file:${resolveSqliteRelativePath(dbPath)}`
}

const ensureSqliteDatabaseFile = (url: string | undefined) => {
	if (!url?.startsWith('file:')) {
		return
	}

	const dbPath = url.slice('file:'.length)
	const resolvedDbPath = dbPath.startsWith('/')
		? dbPath
		: resolveSqliteRelativePath(dbPath)
	const resolvedDir = dirname(resolvedDbPath)

	mkdirSync(resolvedDir, { recursive: true })

	if (!existsSync(resolvedDbPath)) {
		writeFileSync(resolvedDbPath, '')
	}
}

const prismaClientSingleton = () => {
	const databaseUrl = process.env.DATABASE_URL ?? 'file:./dev.db'
	const normalizedUrl = normalizeSqliteUrl(databaseUrl)
	ensureSqliteDatabaseFile(normalizedUrl)

	// 神医：
	// https://stackoverflow.com/questions/78550989/tables-do-not-exist-in-prisma-database-after-nuxt-app-deployment
	// https://github.com/nuxt/nuxt/issues/21753
	return new PrismaClient({
		datasources: {
			db: {
				url: normalizedUrl,
			},
		},
	})
}

declare const globalThis: {
	prismaGlobal: ReturnType<typeof prismaClientSingleton>
} & typeof global

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
