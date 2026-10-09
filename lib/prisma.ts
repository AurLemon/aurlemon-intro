import { PrismaClient } from '../generated/prisma/client.ts'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { resolveSqliteDatabaseUrl } from './database-url.js'

const ensureSqliteDatabaseFile = (url: string | undefined) => {
	if (!url?.startsWith('file:')) {
		return
	}

	const dbPath = url.slice('file:'.length)
	mkdirSync(dirname(dbPath), { recursive: true })

	if (!existsSync(dbPath)) {
		writeFileSync(dbPath, '')
	}
}

const prismaClientSingleton = () => {
	const databaseUrl = resolveSqliteDatabaseUrl()
	ensureSqliteDatabaseFile(databaseUrl)

	const adapter = new PrismaBetterSqlite3(
		{ url: databaseUrl },
		{ timestampFormat: 'unixepoch-ms' },
	)
	return new PrismaClient({ adapter })
}

declare const globalThis: {
	prismaGlobal: ReturnType<typeof prismaClientSingleton>
} & typeof global

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
