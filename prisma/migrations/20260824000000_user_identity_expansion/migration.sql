-- User identity expansion. Legacy GitHub-specific columns remain in place so
-- this release can be rolled back before the later cleanup migration.

PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "handle" TEXT NOT NULL,
    "handleNormalized" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "preferredLocale" TEXT NOT NULL DEFAULT 'zh-CN',
    "preferredAvatarIdentityId" TEXT,
    "isLegacyMigrated" BOOLEAN NOT NULL DEFAULT false,
    "mergedIntoUserId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_preferredAvatarIdentityId_fkey" FOREIGN KEY ("preferredAvatarIdentityId") REFERENCES "OAuthIdentity" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "User_mergedIntoUserId_fkey" FOREIGN KEY ("mergedIntoUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "OAuthIdentity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerUserId" TEXT NOT NULL,
    "providerUsername" TEXT NOT NULL,
    "providerUsernameNormalized" TEXT NOT NULL,
    "providerDisplayName" TEXT,
    "avatarUrl" TEXT NOT NULL,
    "profileUrl" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OAuthIdentity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "UserSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "lastSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "legacySessionId" TEXT,
    CONSTRAINT "UserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "UserEmail" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailNormalized" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserEmail_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "UserNotificationPreference" (
    "userId" TEXT NOT NULL PRIMARY KEY,
    "replyEmailEnabled" BOOLEAN NOT NULL DEFAULT false,
    "adminCommentEmailEnabled" BOOLEAN NOT NULL DEFAULT false,
    "adminFriendLinkEmailEnabled" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "UserNotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "OAuthTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stateHash" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "intent" TEXT NOT NULL,
    "initiatorUserId" TEXT,
    "codeVerifier" TEXT,
    "redirectPath" TEXT NOT NULL DEFAULT '/',
    "expiresAt" DATETIME NOT NULL,
    "consumedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OAuthTransaction_initiatorUserId_fkey" FOREIGN KEY ("initiatorUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "AccountMergeTicket" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tokenHash" TEXT NOT NULL,
    "currentUserId" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerUserId" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "consumedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AccountMergeTicket_currentUserId_fkey" FOREIGN KEY ("currentUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AccountMergeTicket_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "EmailVerificationToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "userEmailId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "consumedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmailVerificationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EmailVerificationToken_userEmailId_fkey" FOREIGN KEY ("userEmailId") REFERENCES "UserEmail" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "DomainEventOutbox" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventType" TEXT NOT NULL,
    "aggregateId" TEXT,
    "payloadJson" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" DATETIME,
    "lastError" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "EmailOutbox" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recipientEmail" TEXT NOT NULL,
    "templateKey" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "variablesJson" TEXT NOT NULL,
    "dedupeKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" DATETIME,
    "lastError" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "AccountMergeAudit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceUserId" TEXT NOT NULL,
    "survivorUserId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerUserId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AccountMergeAudit_sourceUserId_fkey" FOREIGN KEY ("sourceUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AccountMergeAudit_survivorUserId_fkey" FOREIGN KEY ("survivorUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "new_MessageComment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "parentId" TEXT,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "content" TEXT NOT NULL,
    "githubLogin" TEXT NOT NULL,
    "avatarUrl" TEXT NOT NULL,
    "profileUrl" TEXT NOT NULL,
    "authorUserId" TEXT,
    "authorHandleSnapshot" TEXT,
    "authorDisplayNameSnapshot" TEXT,
    "authorAvatarUrlSnapshot" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MessageComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "MessageComment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MessageComment_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_MessageComment" ("id", "parentId", "isPinned", "content", "githubLogin", "avatarUrl", "profileUrl", "createdAt", "updatedAt")
SELECT "id", "parentId", "isPinned", "content", "githubLogin", "avatarUrl", "profileUrl", "createdAt", "updatedAt" FROM "MessageComment";
DROP TABLE "MessageComment";
ALTER TABLE "new_MessageComment" RENAME TO "MessageComment";

CREATE TABLE "new_MessageCommentLike" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "commentId" TEXT NOT NULL,
    "githubLogin" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MessageCommentLike_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "MessageComment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MessageCommentLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_MessageCommentLike" ("id", "commentId", "githubLogin", "createdAt")
SELECT "id", "commentId", "githubLogin", "createdAt" FROM "MessageCommentLike";
DROP TABLE "MessageCommentLike";
ALTER TABLE "new_MessageCommentLike" RENAME TO "MessageCommentLike";

CREATE TABLE "new_FriendLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "desc" TEXT NOT NULL,
    "imageBase64" TEXT NOT NULL,
    "createdByGithubLogin" TEXT NOT NULL,
    "approvedByGithubLogin" TEXT,
    "createdByUserId" TEXT,
    "approvedByUserId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FriendLink_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FriendLink_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_FriendLink" ("id", "name", "url", "desc", "imageBase64", "createdByGithubLogin", "approvedByGithubLogin", "isActive", "createdAt", "updatedAt")
SELECT "id", "name", "url", "desc", "imageBase64", "createdByGithubLogin", "approvedByGithubLogin", "isActive", "createdAt", "updatedAt" FROM "FriendLink";
DROP TABLE "FriendLink";
ALTER TABLE "new_FriendLink" RENAME TO "FriendLink";

CREATE TABLE "new_FriendLinkApplication" (
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
    "applicantUserId" TEXT,
    "approvedByUserId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FriendLinkApplication_applicantUserId_fkey" FOREIGN KEY ("applicantUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FriendLinkApplication_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_FriendLinkApplication" ("id", "name", "url", "desc", "imageBase64", "applicantGithubLogin", "status", "expiresAt", "approvedAt", "approvedByGithubLogin", "createdAt", "updatedAt")
SELECT "id", "name", "url", "desc", "imageBase64", "applicantGithubLogin", "status", "expiresAt", "approvedAt", "approvedByGithubLogin", "createdAt", "updatedAt" FROM "FriendLinkApplication";
DROP TABLE "FriendLinkApplication";
ALTER TABLE "new_FriendLinkApplication" RENAME TO "FriendLinkApplication";

CREATE UNIQUE INDEX "User_handleNormalized_key" ON "User"("handleNormalized");
CREATE INDEX "User_status_createdAt_idx" ON "User"("status", "createdAt");
CREATE INDEX "User_mergedIntoUserId_idx" ON "User"("mergedIntoUserId");
CREATE UNIQUE INDEX "OAuthIdentity_provider_providerUserId_key" ON "OAuthIdentity"("provider", "providerUserId");
CREATE UNIQUE INDEX "OAuthIdentity_userId_provider_key" ON "OAuthIdentity"("userId", "provider");
CREATE INDEX "OAuthIdentity_provider_providerUsernameNormalized_idx" ON "OAuthIdentity"("provider", "providerUsernameNormalized");
CREATE UNIQUE INDEX "UserSession_tokenHash_key" ON "UserSession"("tokenHash");
CREATE UNIQUE INDEX "UserSession_legacySessionId_key" ON "UserSession"("legacySessionId");
CREATE INDEX "UserSession_userId_expiresAt_idx" ON "UserSession"("userId", "expiresAt");
CREATE INDEX "UserSession_expiresAt_idx" ON "UserSession"("expiresAt");
CREATE UNIQUE INDEX "UserEmail_emailNormalized_key" ON "UserEmail"("emailNormalized");
CREATE INDEX "UserEmail_userId_isPrimary_idx" ON "UserEmail"("userId", "isPrimary");
CREATE UNIQUE INDEX "UserEmail_userId_primary_key" ON "UserEmail"("userId") WHERE "isPrimary" = true;
CREATE UNIQUE INDEX "OAuthTransaction_stateHash_key" ON "OAuthTransaction"("stateHash");
CREATE INDEX "OAuthTransaction_expiresAt_idx" ON "OAuthTransaction"("expiresAt");
CREATE UNIQUE INDEX "AccountMergeTicket_tokenHash_key" ON "AccountMergeTicket"("tokenHash");
CREATE INDEX "AccountMergeTicket_currentUserId_expiresAt_idx" ON "AccountMergeTicket"("currentUserId", "expiresAt");
CREATE INDEX "AccountMergeTicket_targetUserId_expiresAt_idx" ON "AccountMergeTicket"("targetUserId", "expiresAt");
CREATE UNIQUE INDEX "EmailVerificationToken_tokenHash_key" ON "EmailVerificationToken"("tokenHash");
CREATE INDEX "EmailVerificationToken_userId_expiresAt_idx" ON "EmailVerificationToken"("userId", "expiresAt");
CREATE INDEX "DomainEventOutbox_status_nextAttemptAt_idx" ON "DomainEventOutbox"("status", "nextAttemptAt");
CREATE INDEX "DomainEventOutbox_eventType_aggregateId_idx" ON "DomainEventOutbox"("eventType", "aggregateId");
CREATE UNIQUE INDEX "EmailOutbox_dedupeKey_key" ON "EmailOutbox"("dedupeKey");
CREATE INDEX "EmailOutbox_status_nextAttemptAt_idx" ON "EmailOutbox"("status", "nextAttemptAt");
CREATE INDEX "AccountMergeAudit_sourceUserId_idx" ON "AccountMergeAudit"("sourceUserId");
CREATE INDEX "AccountMergeAudit_survivorUserId_idx" ON "AccountMergeAudit"("survivorUserId");
CREATE INDEX "MessageComment_authorUserId_idx" ON "MessageComment"("authorUserId");
CREATE INDEX "MessageComment_parentId_idx" ON "MessageComment"("parentId");
CREATE INDEX "MessageComment_createdAt_idx" ON "MessageComment"("createdAt");
CREATE INDEX "MessageComment_isPinned_createdAt_idx" ON "MessageComment"("isPinned", "createdAt");
CREATE UNIQUE INDEX "MessageCommentLike_commentId_githubLogin_key" ON "MessageCommentLike"("commentId", "githubLogin");
CREATE UNIQUE INDEX "MessageCommentLike_commentId_userId_key" ON "MessageCommentLike"("commentId", "userId");
CREATE INDEX "MessageCommentLike_githubLogin_idx" ON "MessageCommentLike"("githubLogin");
CREATE INDEX "MessageCommentLike_userId_idx" ON "MessageCommentLike"("userId");
CREATE UNIQUE INDEX "FriendLink_url_key" ON "FriendLink"("url");
CREATE INDEX "FriendLink_isActive_createdAt_idx" ON "FriendLink"("isActive", "createdAt");
CREATE INDEX "FriendLink_createdByUserId_idx" ON "FriendLink"("createdByUserId");
CREATE INDEX "FriendLink_approvedByUserId_idx" ON "FriendLink"("approvedByUserId");
CREATE INDEX "FriendLinkApplication_status_expiresAt_idx" ON "FriendLinkApplication"("status", "expiresAt");
CREATE UNIQUE INDEX "FriendLinkApplication_pending_url_key" ON "FriendLinkApplication"("url") WHERE "status" = 'pending';
CREATE INDEX "FriendLinkApplication_applicantGithubLogin_createdAt_idx" ON "FriendLinkApplication"("applicantGithubLogin", "createdAt");
CREATE INDEX "FriendLinkApplication_applicantUserId_createdAt_idx" ON "FriendLinkApplication"("applicantUserId", "createdAt");
CREATE INDEX "FriendLinkApplication_approvedByUserId_idx" ON "FriendLinkApplication"("approvedByUserId");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
