import { defineEventHandler } from 'h3'

export default defineEventHandler(() => {
	// Prisma/SQLite temporarily disabled to avoid dev-time errors.
	return { error: 'Like API disabled' }
})
