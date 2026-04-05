import { PrismaClient } from '@prisma/client'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const normalizeSqliteUrl = (url: string | undefined): string | undefined => {
	if (!url?.startsWith('file:')) {
		return url
	}

	const dbPath = url.slice('file:'.length)

	if (dbPath.startsWith('/')) {
		return url
	}

	return `file:${resolve(process.cwd(), dbPath)}`
}

const ensureSqliteDatabaseFile = (url: string | undefined) => {
	if (!url?.startsWith('file:')) {
		return
	}

	const dbPath = url.slice('file:'.length)
	const resolvedDbPath = resolve(process.cwd(), dbPath)
	const resolvedDir = dirname(resolvedDbPath)

	mkdirSync(resolvedDir, { recursive: true })

	if (!existsSync(resolvedDbPath)) {
		writeFileSync(resolvedDbPath, '')
	}
}

const prismaClientSingleton = () => {
	const config = useRuntimeConfig()
	const runtimeDatabaseUrl = process.env.DATABASE_URL ?? config.bdUrl
	const normalizedUrl = normalizeSqliteUrl(runtimeDatabaseUrl)
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
