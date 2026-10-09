import { createHash, randomUUID } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import {
	OAuthProvider,
	Prisma,
	PrismaClient,
	UserRole,
} from '../generated/prisma/client.ts'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { resolveSqliteDatabaseUrl } from '../lib/database-url.js'
import type { Prisma as PrismaTypes } from '../generated/prisma/client.ts'

interface LegacyCounts {
	sessions: number
	comments: number
	commentLikes: number
	friendLinksCreated: number
	friendLinksApproved: number
	friendLinkApplications: number
	friendLinkApplicationsApproved: number
}

interface GithubApiUser {
	id: number
	login: string
	name: string | null
	avatar_url: string
	html_url: string
}

interface ManifestUser {
	userId: string
	providerUserId: string
	canonicalLogin: string
	legacyLogins: string[]
	username: string
	displayName: string
	avatarUrl: string
	profileUrl: string
	createdAt: string
	role: 'USER' | 'ADMIN'
	counts: LegacyCounts
}

interface MigrationManifest {
	version: 1
	generatedAt: string
	users: ManifestUser[]
}

interface LegacyRecord {
	login: string
	createdAt: Date
	kind: keyof LegacyCounts
}

interface ForeignKeyViolation {
	table: string
	rowid: number
	parent: string
	fkid: number
}

const prisma = new PrismaClient({
	adapter: new PrismaBetterSqlite3(
		{ url: resolveSqliteDatabaseUrl() },
		{ timestampFormat: 'unixepoch-ms' },
	),
})
const HANDLE_PATTERN = /^[A-Za-z0-9_-]{1,39}$/

const hashToken = (value: string): string =>
	createHash('sha256').update(value).digest('hex')

const normalize = (value: string): string => value.trim().toLowerCase()

const parseArgs = () => {
	const args = process.argv.slice(2)
	const mode = args.find((item) =>
		['--status', '--check', '--apply', '--verify'].includes(item),
	)
	const manifestIndex = args.indexOf('--manifest')
	const manifestArgument =
		manifestIndex >= 0 ? args[manifestIndex + 1] : undefined
	const manifestPath = resolve(
		manifestArgument ?? 'social-users.social-user-manifest.json',
	)

	if (!mode) {
		throw new Error(
			'USAGE: --status|--check|--apply|--verify [--manifest path]',
		)
	}

	return { mode, manifestPath }
}

const runStatus = async (): Promise<void> => {
	const tables = await prisma.$queryRawUnsafe<Array<{ name: string }>>(
		`SELECT "name" FROM "sqlite_master" WHERE "type" = 'table' AND "name" = 'User'`,
	)
	if (tables.length === 0) {
		console.info('USER_IDENTITY_MIGRATION_STATUS=pending')
		return
	}

	const [legacyRecords, migratedUsers, unmappedRelations] = await Promise.all([
		loadLegacyRecords(),
		prisma.user.count({ where: { isLegacyMigrated: true } }),
		Promise.all([
			prisma.messageComment.count({ where: { authorUserId: null } }),
			prisma.messageCommentLike.count({ where: { userId: null } }),
			prisma.friendLink.count({ where: { createdByUserId: null } }),
			prisma.friendLinkApplication.count({ where: { applicantUserId: null } }),
		]),
	])
	const complete =
		legacyRecords.length === 0 ||
		(migratedUsers > 0 && unmappedRelations.every((count) => count === 0))
	console.info(
		`USER_IDENTITY_MIGRATION_STATUS=${complete ? 'complete' : 'incomplete'}`,
	)
}

const emptyCounts = (): LegacyCounts => ({
	sessions: 0,
	comments: 0,
	commentLikes: 0,
	friendLinksCreated: 0,
	friendLinksApproved: 0,
	friendLinkApplications: 0,
	friendLinkApplicationsApproved: 0,
})

const loadLegacyRecords = async (): Promise<LegacyRecord[]> => {
	const [sessions, comments, likes, links, applications] = await Promise.all([
		prisma.githubSession.findMany({
			select: { githubLogin: true, createdAt: true },
		}),
		prisma.messageComment.findMany({
			select: { githubLogin: true, createdAt: true },
		}),
		prisma.messageCommentLike.findMany({
			select: { githubLogin: true, createdAt: true },
		}),
		prisma.friendLink.findMany({
			select: {
				createdByGithubLogin: true,
				approvedByGithubLogin: true,
				createdAt: true,
			},
		}),
		prisma.friendLinkApplication.findMany({
			select: {
				applicantGithubLogin: true,
				approvedByGithubLogin: true,
				createdAt: true,
				approvedAt: true,
			},
		}),
	])

	return [
		...sessions.map((item) => ({
			login: item.githubLogin,
			createdAt: item.createdAt,
			kind: 'sessions' as const,
		})),
		...comments.map((item) => ({
			login: item.githubLogin,
			createdAt: item.createdAt,
			kind: 'comments' as const,
		})),
		...likes.map((item) => ({
			login: item.githubLogin,
			createdAt: item.createdAt,
			kind: 'commentLikes' as const,
		})),
		...links.flatMap((item) => [
			{
				login: item.createdByGithubLogin,
				createdAt: item.createdAt,
				kind: 'friendLinksCreated' as const,
			},
			...(item.approvedByGithubLogin
				? [
						{
							login: item.approvedByGithubLogin,
							createdAt: item.createdAt,
							kind: 'friendLinksApproved' as const,
						},
					]
				: []),
		]),
		...applications.flatMap((item) => [
			{
				login: item.applicantGithubLogin,
				createdAt: item.createdAt,
				kind: 'friendLinkApplications' as const,
			},
			...(item.approvedByGithubLogin
				? [
						{
							login: item.approvedByGithubLogin,
							createdAt: item.approvedAt ?? item.createdAt,
							kind: 'friendLinkApplicationsApproved' as const,
						},
					]
				: []),
		]),
	].filter((item) => item.login.trim())
}

const fetchGithubUser = async (login: string): Promise<GithubApiUser> => {
	const token = process.env.GITHUB_TOKEN ?? process.env.GITHUB_PAT
	const response = await fetch(
		`https://api.github.com/users/${encodeURIComponent(login)}`,
		{
			headers: {
				accept: 'application/vnd.github+json',
				'user-agent': 'AurLemon-Intro-Migration',
				...(token ? { authorization: `Bearer ${token}` } : {}),
			},
			signal: AbortSignal.timeout(20_000),
		},
	)

	if (!response.ok) {
		throw new Error(`GITHUB_LOOKUP_FAILED: ${login} status=${response.status}`)
	}

	const user = (await response.json()) as Partial<GithubApiUser>

	if (
		typeof user.id !== 'number' ||
		!user.login ||
		!user.avatar_url ||
		!user.html_url
	) {
		throw new Error(`GITHUB_LOOKUP_INVALID: ${login}`)
	}

	return user as GithubApiUser
}

const resolveUsername = (login: string, used: Set<string>): string => {
	const base = HANDLE_PATTERN.test(login)
		? login
		: login.replace(/[^A-Za-z0-9_-]/g, '-').slice(0, 39) || 'user'
	let candidate = base
	let suffix = 1

	while (used.has(normalize(candidate))) {
		const marker = `-${suffix}`
		candidate = `${base.slice(0, 39 - marker.length)}${marker}`
		suffix += 1
	}

	used.add(normalize(candidate))
	return candidate
}

const runCheck = async (manifestPath: string): Promise<void> => {
	const records = await loadLegacyRecords()
	const loginGroups = new Map<string, LegacyRecord[]>()

	for (const record of records) {
		const key = normalize(record.login)
		const group = loginGroups.get(key) ?? []
		group.push(record)
		loginGroups.set(key, group)
	}

	const lookups = new Map<string, GithubApiUser>()
	const errors: string[] = []

	for (const [normalizedLogin, group] of loginGroups) {
		try {
			lookups.set(normalizedLogin, await fetchGithubUser(group[0]!.login))
		} catch (error) {
			errors.push(error instanceof Error ? error.message : String(error))
		}
	}

	if (errors.length > 0) {
		throw new Error(`IDENTITY_PREFLIGHT_FAILED:\n${errors.join('\n')}`)
	}

	const byProviderId = new Map<
		string,
		{ apiUser: GithubApiUser; records: LegacyRecord[] }
	>()

	for (const [normalizedLogin, group] of loginGroups) {
		const apiUser = lookups.get(normalizedLogin)!
		const providerId = String(apiUser.id)
		const current = byProviderId.get(providerId) ?? { apiUser, records: [] }
		current.records.push(...group)
		byProviderId.set(providerId, current)
	}

	const adminLogins = new Set(
		(process.env.ADMIN_GITHUB_IDS ?? 'AurLemon')
			.split(',')
			.map(normalize)
			.filter(Boolean),
	)
	const usedUsernames = new Set<string>()
	const users: ManifestUser[] = []

	for (const [providerUserId, entry] of byProviderId) {
		const legacyLogins = [
			...new Set(entry.records.map((item) => item.login)),
		].sort((a, b) => a.localeCompare(b))
		const counts = emptyCounts()

		for (const record of entry.records) {
			counts[record.kind] += 1
		}

		users.push({
			userId: randomUUID(),
			providerUserId,
			canonicalLogin: entry.apiUser.login,
			legacyLogins,
			username: resolveUsername(entry.apiUser.login, usedUsernames),
			displayName: entry.apiUser.name?.trim() || entry.apiUser.login,
			avatarUrl: entry.apiUser.avatar_url,
			profileUrl: entry.apiUser.html_url,
			createdAt: new Date(
				Math.min(...entry.records.map((item) => item.createdAt.getTime())),
			).toISOString(),
			role:
				adminLogins.has(providerUserId) ||
				legacyLogins.some((item) => adminLogins.has(normalize(item)))
					? 'ADMIN'
					: 'USER',
			counts,
		})
	}

	users.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
	const manifest: MigrationManifest = {
		version: 1,
		generatedAt: new Date().toISOString(),
		users,
	}

	await writeFile(
		manifestPath,
		`${JSON.stringify(manifest, null, 2)}\n`,
		'utf8',
	)
	console.info(`IDENTITY_PREFLIGHT_OK: users=${users.length}`)
	console.info(`MANIFEST_WRITTEN: ${manifestPath}`)
	for (const user of users) {
		const recordCount = Object.values(user.counts).reduce(
			(total, count) => total + count,
			0,
		)
		console.info(
			`${user.legacyLogins.join(',')} -> github:${user.providerUserId} -> ${user.canonicalLogin} -> records=${recordCount} -> ${user.userId}`,
		)
	}
}

const readManifest = async (
	manifestPath: string,
): Promise<MigrationManifest> => {
	const parsed = JSON.parse(
		await readFile(manifestPath, 'utf8'),
	) as MigrationManifest

	if (parsed.version !== 1 || !Array.isArray(parsed.users)) {
		throw new Error('INVALID_MIGRATION_MANIFEST')
	}

	const ids = new Set<string>()
	const providerIds = new Set<string>()
	const usernames = new Set<string>()

	for (const user of parsed.users) {
		if (
			!user.userId ||
			!user.providerUserId ||
			!user.canonicalLogin ||
			!user.legacyLogins.length ||
			ids.has(user.userId) ||
			providerIds.has(user.providerUserId) ||
			!HANDLE_PATTERN.test(user.username) ||
			usernames.has(normalize(user.username))
		) {
			throw new Error('INVALID_MIGRATION_MANIFEST_USER')
		}

		ids.add(user.userId)
		providerIds.add(user.providerUserId)
		usernames.add(normalize(user.username))
	}

	return parsed
}

const upsertLegacyUser = async (
	tx: PrismaTypes.TransactionClient,
	manifestUser: ManifestUser,
): Promise<void> => {
	const existingIdentity = await tx.oAuthIdentity.findUnique({
		where: {
			provider_providerUserId: {
				provider: OAuthProvider.GITHUB,
				providerUserId: manifestUser.providerUserId,
			},
		},
	})

	if (existingIdentity && existingIdentity.userId !== manifestUser.userId) {
		throw new Error(
			`IDENTITY_CONFLICT: github:${manifestUser.providerUserId} belongs to ${existingIdentity.userId}`,
		)
	}

	const createdAt = new Date(manifestUser.createdAt)
	const user = await tx.user.upsert({
		where: { id: manifestUser.userId },
		create: {
			id: manifestUser.userId,
			username: manifestUser.username,
			usernameNormalized: normalize(manifestUser.username),
			displayName: manifestUser.displayName,
			role: manifestUser.role === 'ADMIN' ? UserRole.ADMIN : UserRole.USER,
			isLegacyMigrated: true,
			createdAt,
			notificationPreference: {
				create: { replyEmailEnabled: true },
			},
		},
		update: {
			role: manifestUser.role === 'ADMIN' ? UserRole.ADMIN : undefined,
			isLegacyMigrated: true,
		},
	})

	const identity = await tx.oAuthIdentity.upsert({
		where: {
			provider_providerUserId: {
				provider: OAuthProvider.GITHUB,
				providerUserId: manifestUser.providerUserId,
			},
		},
		create: {
			userId: user.id,
			provider: OAuthProvider.GITHUB,
			providerUserId: manifestUser.providerUserId,
			providerUsername: manifestUser.canonicalLogin,
			providerUsernameNormalized: normalize(manifestUser.canonicalLogin),
			providerDisplayName: manifestUser.displayName,
			avatarUrl: manifestUser.avatarUrl,
			profileUrl: manifestUser.profileUrl,
			createdAt,
		},
		update: {
			providerUsername: manifestUser.canonicalLogin,
			providerUsernameNormalized: normalize(manifestUser.canonicalLogin),
			providerDisplayName: manifestUser.displayName,
			avatarUrl: manifestUser.avatarUrl,
			profileUrl: manifestUser.profileUrl,
		},
	})

	if (!user.preferredAvatarIdentityId) {
		await tx.user.update({
			where: { id: user.id },
			data: { preferredAvatarIdentityId: identity.id },
		})
	}

	const loginFilter = { in: manifestUser.legacyLogins }
	await tx.messageComment.updateMany({
		where: { githubLogin: loginFilter },
		data: {
			authorUserId: user.id,
			authorHandleSnapshot: user.username,
			authorDisplayNameSnapshot: user.displayName,
			authorAvatarUrlSnapshot: manifestUser.avatarUrl,
		},
	})

	const legacyLikes = await tx.messageCommentLike.findMany({
		where: { githubLogin: loginFilter },
		orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
	})
	const seenComments = new Set<string>()
	for (const like of legacyLikes) {
		const alreadyMapped = await tx.messageCommentLike.findFirst({
			where: {
				commentId: like.commentId,
				userId: user.id,
				NOT: { id: like.id },
			},
			select: { id: true },
		})

		if (seenComments.has(like.commentId) || alreadyMapped) {
			await tx.messageCommentLike.delete({ where: { id: like.id } })
			continue
		}

		seenComments.add(like.commentId)
		await tx.messageCommentLike.update({
			where: { id: like.id },
			data: { userId: user.id },
		})
	}

	await Promise.all([
		tx.friendLink.updateMany({
			where: { createdByGithubLogin: loginFilter },
			data: { createdByUserId: user.id },
		}),
		tx.friendLink.updateMany({
			where: { approvedByGithubLogin: loginFilter },
			data: { approvedByUserId: user.id },
		}),
		tx.friendLinkApplication.updateMany({
			where: { applicantGithubLogin: loginFilter },
			data: { applicantUserId: user.id },
		}),
		tx.friendLinkApplication.updateMany({
			where: { approvedByGithubLogin: loginFilter },
			data: { approvedByUserId: user.id },
		}),
	])

	const sessions = await tx.githubSession.findMany({
		where: {
			githubLogin: loginFilter,
			expiresAt: { gt: new Date() },
		},
	})

	for (const session of sessions) {
		await tx.userSession.upsert({
			where: { legacySessionId: session.id },
			create: {
				userId: user.id,
				tokenHash: hashToken(session.sessionToken),
				expiresAt: session.expiresAt,
				createdAt: session.createdAt,
				lastSeenAt: session.createdAt,
				legacySessionId: session.id,
			},
			update: {
				userId: user.id,
				tokenHash: hashToken(session.sessionToken),
				expiresAt: session.expiresAt,
			},
		})
	}
}

const runApply = async (manifestPath: string): Promise<void> => {
	const manifest = await readManifest(manifestPath)

	await prisma.$transaction(
		async (tx) => {
			for (const user of manifest.users) {
				await upsertLegacyUser(tx, user)
			}
		},
		{ timeout: 120_000 },
	)

	console.info(`IDENTITY_BACKFILL_OK: users=${manifest.users.length}`)
}

const runVerify = async (manifestPath: string): Promise<void> => {
	const manifest = await readManifest(manifestPath)
	const failures: string[] = []

	for (const manifestUser of manifest.users) {
		const loginFilter = { in: manifestUser.legacyLogins }
		const [
			user,
			identity,
			comments,
			unmappedComments,
			unmappedLikes,
			createdLinks,
			approvedLinks,
			applications,
			approvedApplications,
			activeLegacySessions,
			convertedSessions,
		] = await Promise.all([
			prisma.user.findUnique({ where: { id: manifestUser.userId } }),
			prisma.oAuthIdentity.findUnique({
				where: {
					provider_providerUserId: {
						provider: OAuthProvider.GITHUB,
						providerUserId: manifestUser.providerUserId,
					},
				},
			}),
			prisma.messageComment.count({
				where: { githubLogin: loginFilter, authorUserId: manifestUser.userId },
			}),
			prisma.messageComment.count({
				where: {
					githubLogin: loginFilter,
					OR: [
						{ authorUserId: null },
						{ authorUserId: { not: manifestUser.userId } },
					],
				},
			}),
			prisma.messageCommentLike.count({
				where: {
					githubLogin: loginFilter,
					OR: [{ userId: null }, { userId: { not: manifestUser.userId } }],
				},
			}),
			prisma.friendLink.count({
				where: {
					createdByGithubLogin: loginFilter,
					createdByUserId: manifestUser.userId,
				},
			}),
			prisma.friendLink.count({
				where: {
					approvedByGithubLogin: loginFilter,
					approvedByUserId: manifestUser.userId,
				},
			}),
			prisma.friendLinkApplication.count({
				where: {
					applicantGithubLogin: loginFilter,
					applicantUserId: manifestUser.userId,
				},
			}),
			prisma.friendLinkApplication.count({
				where: {
					approvedByGithubLogin: loginFilter,
					approvedByUserId: manifestUser.userId,
				},
			}),
			prisma.githubSession.findMany({
				where: { githubLogin: loginFilter, expiresAt: { gt: new Date() } },
				select: { id: true },
			}),
			prisma.userSession.findMany({
				where: { userId: manifestUser.userId, legacySessionId: { not: null } },
				select: { legacySessionId: true },
			}),
		])

		if (!user || !user.isLegacyMigrated) {
			failures.push(`USER_MISSING user=${manifestUser.userId}`)
		} else {
			if (user.createdAt.toISOString() !== manifestUser.createdAt) {
				failures.push(
					`USER_CREATED_AT_MISMATCH user=${manifestUser.userId} expected=${manifestUser.createdAt} actual=${user.createdAt.toISOString()}`,
				)
			}
			if (user.role !== manifestUser.role) {
				failures.push(
					`USER_ROLE_MISMATCH user=${manifestUser.userId} expected=${manifestUser.role} actual=${user.role}`,
				)
			}
		}
		if (!identity || identity.userId !== manifestUser.userId) {
			failures.push(
				`IDENTITY_MISMATCH github=${manifestUser.providerUserId} user=${manifestUser.userId}`,
			)
		}
		if (comments !== manifestUser.counts.comments || unmappedComments > 0) {
			failures.push(
				`COMMENT_COUNT_MISMATCH user=${manifestUser.userId} expected=${manifestUser.counts.comments} actual=${comments} unmapped=${unmappedComments}`,
			)
		}
		if (unmappedLikes > 0) {
			failures.push(
				`COMMENT_LIKE_MAPPING_MISMATCH user=${manifestUser.userId} unmapped=${unmappedLikes}`,
			)
		}
		const countChecks = [
			['friendLinksCreated', createdLinks],
			['friendLinksApproved', approvedLinks],
			['friendLinkApplications', applications],
			['friendLinkApplicationsApproved', approvedApplications],
		] as const
		for (const [key, actual] of countChecks) {
			if (actual !== manifestUser.counts[key]) {
				failures.push(
					`RELATION_COUNT_MISMATCH user=${manifestUser.userId} relation=${key} expected=${manifestUser.counts[key]} actual=${actual}`,
				)
			}
		}
		const convertedIds = new Set(
			convertedSessions.map((item) => item.legacySessionId),
		)
		const missingSessions = activeLegacySessions.filter(
			(item) => !convertedIds.has(item.id),
		)
		if (missingSessions.length > 0) {
			failures.push(
				`ACTIVE_SESSION_MISMATCH user=${manifestUser.userId} missing=${missingSessions.length}`,
			)
		}
	}

	const duplicateLikes = await prisma.$queryRaw<
		Array<{ commentId: string; userId: string; count: bigint }>
	>(Prisma.sql`
		SELECT "commentId", "userId", COUNT(*) AS "count"
		FROM "MessageCommentLike"
		WHERE "userId" IS NOT NULL
		GROUP BY "commentId", "userId"
		HAVING COUNT(*) > 1
	`)

	if (duplicateLikes.length > 0) {
		failures.push(`DUPLICATE_COMMENT_LIKES count=${duplicateLikes.length}`)
	}

	const foreignKeyViolations = await prisma.$queryRawUnsafe<
		ForeignKeyViolation[]
	>('PRAGMA foreign_key_check')
	if (foreignKeyViolations.length > 0) {
		failures.push(`FOREIGN_KEY_VIOLATIONS count=${foreignKeyViolations.length}`)
	}

	if (failures.length > 0) {
		throw new Error(`IDENTITY_VERIFY_FAILED:\n${failures.join('\n')}`)
	}

	console.info(
		`IDENTITY_VERIFY_OK: users=${manifest.users.length} foreignKeys=ok`,
	)
}

const main = async () => {
	const { mode, manifestPath } = parseArgs()

	if (mode === '--status') {
		await runStatus()
		return
	}
	if (mode === '--check') {
		await runCheck(manifestPath)
		return
	}
	if (mode === '--apply') {
		await runApply(manifestPath)
		return
	}

	await runVerify(manifestPath)
}

main()
	.catch((error: unknown) => {
		console.error(error instanceof Error ? error.message : error)
		process.exitCode = 1
	})
	.finally(async () => {
		await prisma.$disconnect()
	})
