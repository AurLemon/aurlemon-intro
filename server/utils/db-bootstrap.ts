import prisma from '~/lib/prisma'

const BOOTSTRAP_STATEMENTS = [
	`CREATE TABLE IF NOT EXISTS "Like" (
		"id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
		"ip" TEXT NOT NULL,
		"fingerprint" TEXT NOT NULL,
		"uuid" TEXT NOT NULL,
		"timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
	)`,
	`CREATE UNIQUE INDEX IF NOT EXISTS "Like_fingerprint_key" ON "Like"("fingerprint")`,
	`CREATE TABLE IF NOT EXISTS "GithubSession" (
		"id" TEXT NOT NULL PRIMARY KEY,
		"sessionToken" TEXT NOT NULL,
		"githubLogin" TEXT NOT NULL,
		"avatarUrl" TEXT NOT NULL,
		"profileUrl" TEXT NOT NULL,
		"expiresAt" DATETIME NOT NULL,
		"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
	)`,
	`CREATE UNIQUE INDEX IF NOT EXISTS "GithubSession_sessionToken_key" ON "GithubSession"("sessionToken")`,
	`CREATE INDEX IF NOT EXISTS "GithubSession_githubLogin_idx" ON "GithubSession"("githubLogin")`,
	`CREATE INDEX IF NOT EXISTS "GithubSession_expiresAt_idx" ON "GithubSession"("expiresAt")`,
	`CREATE TABLE IF NOT EXISTS "MessageComment" (
		"id" TEXT NOT NULL PRIMARY KEY,
		"parentId" TEXT,
		"content" TEXT NOT NULL,
		"githubLogin" TEXT NOT NULL,
		"avatarUrl" TEXT NOT NULL,
		"profileUrl" TEXT NOT NULL,
		"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
		"updatedAt" DATETIME NOT NULL,
		CONSTRAINT "MessageComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "MessageComment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
	)`,
	`CREATE INDEX IF NOT EXISTS "MessageComment_parentId_idx" ON "MessageComment"("parentId")`,
	`CREATE INDEX IF NOT EXISTS "MessageComment_createdAt_idx" ON "MessageComment"("createdAt")`,
	`CREATE TABLE IF NOT EXISTS "MessageCommentLike" (
		"id" TEXT NOT NULL PRIMARY KEY,
		"commentId" TEXT NOT NULL,
		"githubLogin" TEXT NOT NULL,
		"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
		CONSTRAINT "MessageCommentLike_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "MessageComment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
	)`,
	`CREATE UNIQUE INDEX IF NOT EXISTS "MessageCommentLike_commentId_githubLogin_key" ON "MessageCommentLike"("commentId", "githubLogin")`,
	`CREATE INDEX IF NOT EXISTS "MessageCommentLike_githubLogin_idx" ON "MessageCommentLike"("githubLogin")`,
	`CREATE TABLE IF NOT EXISTS "FriendLink" (
		"id" TEXT NOT NULL PRIMARY KEY,
		"name" TEXT NOT NULL,
		"url" TEXT NOT NULL,
		"desc" TEXT NOT NULL,
		"imageBase64" TEXT NOT NULL,
		"createdByGithubLogin" TEXT NOT NULL,
		"approvedByGithubLogin" TEXT,
		"isActive" BOOLEAN NOT NULL DEFAULT true,
		"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
		"updatedAt" DATETIME NOT NULL
	)`,
	`CREATE UNIQUE INDEX IF NOT EXISTS "FriendLink_url_key" ON "FriendLink"("url")`,
	`CREATE INDEX IF NOT EXISTS "FriendLink_isActive_createdAt_idx" ON "FriendLink"("isActive", "createdAt")`,
	`CREATE TABLE IF NOT EXISTS "FriendLinkApplication" (
		"id" TEXT NOT NULL PRIMARY KEY,
		"name" TEXT NOT NULL,
		"url" TEXT NOT NULL,
		"desc" TEXT NOT NULL,
		"imageBase64" TEXT NOT NULL,
		"applicantGithubLogin" TEXT NOT NULL,
		"status" TEXT NOT NULL DEFAULT 'pending',
		"expiresAt" DATETIME NOT NULL,
		"approvedAt" DATETIME,
		"approvedByGithubLogin" TEXT,
		"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
		"updatedAt" DATETIME NOT NULL
	)`,
	`CREATE INDEX IF NOT EXISTS "FriendLinkApplication_status_expiresAt_idx" ON "FriendLinkApplication"("status", "expiresAt")`,
	`CREATE INDEX IF NOT EXISTS "FriendLinkApplication_applicantGithubLogin_createdAt_idx" ON "FriendLinkApplication"("applicantGithubLogin", "createdAt")`,
] as const

const hasBootstrapTables = async (): Promise<boolean> => {
	const result = await prisma.$queryRawUnsafe<Array<{ name: string }>>(
		`SELECT name FROM sqlite_master WHERE type='table' AND name='Like' LIMIT 1`,
	)

	return result.length > 0
}

export const ensureDatabaseBootstrap = async (): Promise<void> => {
	if (await hasBootstrapTables()) {
		return
	}

	for (const statement of BOOTSTRAP_STATEMENTS) {
		await prisma.$executeRawUnsafe(statement)
	}
}
