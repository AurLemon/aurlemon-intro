import { OAuthProvider, OutboxStatus } from '~/generated/prisma/client'
import prisma from '~/lib/prisma'
import { getBangumiStatus } from '~/server/utils/bangumi'
import { getGithubContributionStatus } from '~/server/utils/github-contributions'
import { isOAuthProviderConfigured } from '~/server/utils/oauth-providers'
import type {
	SiteMetaResponse,
	SiteServiceStatus,
} from '~/shared/types/site-meta'

const readServices = async (): Promise<SiteServiceStatus[]> => {
	const [github, bangumi, database, email] = await Promise.allSettled([
		getGithubContributionStatus(),
		getBangumiStatus(),
		prisma.$queryRaw<Array<{ value: bigint }>>`SELECT 1 AS value`,
		prisma.emailOutbox.count({ where: { status: OutboxStatus.FAILED } }),
	])
	const smtpConfigured = [
		'SMTP_HOST',
		'SMTP_USER',
		'SMTP_PASS',
		'MAIL_FROM_ADDRESS',
	].every((key) => Boolean(process.env[key]))
	return [
		github.status === 'fulfilled'
			? github.value
			: { id: 'github', state: 'unavailable' },
		bangumi.status === 'fulfilled'
			? bangumi.value
			: { id: 'bangumi', state: 'unavailable' },
		{
			id: 'githubOAuth',
			state: isOAuthProviderConfigured(OAuthProvider.GITHUB)
				? 'configured'
				: 'unconfigured',
		},
		{
			id: 'linuxdo',
			state: isOAuthProviderConfigured(OAuthProvider.LINUX_DO)
				? 'configured'
				: 'unconfigured',
		},
		{
			id: 'database',
			state:
				database.status === 'fulfilled' &&
				Number(database.value[0]?.value) === 1
					? 'available'
					: 'unavailable',
		},
		{
			id: 'email',
			state: !smtpConfigured
				? 'unconfigured'
				: email.status === 'rejected'
					? 'unavailable'
					: email.value > 0
						? 'degraded'
						: 'configured',
		},
	]
}

// Reuse the existing cache layer: opening this page never probes upstream services.
const getServices = defineCachedFunction(readServices, {
	name: 'public-site-services',
	maxAge: 30,
	swr: false,
})

export default defineEventHandler(async (event): Promise<SiteMetaResponse> => {
	setHeader(event, 'Cache-Control', 'no-store')
	return {
		build: useRuntimeConfig(event).siteBuild,
		runtime: {
			node: process.version,
			v8: process.versions.v8,
			platform: process.platform,
			architecture: process.arch,
			timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
		},
		services: await getServices(),
	}
})
