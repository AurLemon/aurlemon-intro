import 'dotenv/config'
import { defineConfig } from 'prisma/config'
import { resolveSqliteDatabaseUrl } from './lib/database-url'

export default defineConfig({
	schema: 'prisma/schema.prisma',
	migrations: { path: 'prisma/migrations' },
	datasource: { url: resolveSqliteDatabaseUrl() },
})
