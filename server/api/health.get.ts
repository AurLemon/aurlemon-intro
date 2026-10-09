import { OutboxStatus } from '~/generated/prisma/client'
import prisma from '~/lib/prisma'

export default defineEventHandler(async () => {
	const [database, failedDomainEvents, failedEmails] = await Promise.all([
		prisma.$queryRaw<Array<{ value: bigint }>>`SELECT 1 AS value`,
		prisma.domainEventOutbox.count({
			where: { status: OutboxStatus.FAILED },
		}),
		prisma.emailOutbox.count({ where: { status: OutboxStatus.FAILED } }),
	])

	return {
		ok: Number(database[0]?.value) === 1,
		database: 'ok',
		outbox: {
			failedDomainEvents,
			failedEmails,
		},
		timestamp: new Date().toISOString(),
	}
})
