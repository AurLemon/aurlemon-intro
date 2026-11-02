import { randomUUID } from 'node:crypto'
import prisma from '~/lib/prisma'
import { hashSecret } from '~/server/utils/user-auth'
import { startOAuthProgress } from '~/server/utils/oauth-progress'

const getLocalePrefix = (redirectPath: string | undefined): string => {
	const match = redirectPath?.match(/^\/(en-US|ja-JP)(?:\/|$)/)
	return match ? `/${match[1]}` : ''
}

export default defineEventHandler(async (event) => {
	const query = getQuery(event)
	const code = typeof query.code === 'string' ? query.code : ''
	const state = typeof query.state === 'string' ? query.state : ''
	const safeCode = code.length <= 2048 ? code : ''
	const safeState = state.length <= 2048 ? state : ''
	const traceId = randomUUID()
	let localePrefix = ''

	if (safeState) {
		const transaction = await prisma.oAuthTransaction
			.findUnique({ where: { stateHash: hashSecret(safeState) } })
			.catch(() => null)
		localePrefix = getLocalePrefix(transaction?.redirectPath)
	}

	startOAuthProgress(traceId, safeCode, safeState, localePrefix)
	setResponseHeader(event, 'cache-control', 'no-store, private')
	setResponseHeader(event, 'referrer-policy', 'no-referrer')
	return sendRedirect(event, `${localePrefix}/oauth/callback?flow=${traceId}`)
})
