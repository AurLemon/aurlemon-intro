-- CreateIndex
CREATE UNIQUE INDEX "Like_fingerprint_key" ON "Like"("fingerprint");

-- CreateTable
CREATE TABLE "GithubSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "githubLogin" TEXT NOT NULL,
    "avatarUrl" TEXT NOT NULL,
    "profileUrl" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "MessageComment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "parentId" TEXT,
    "content" TEXT NOT NULL,
    "githubLogin" TEXT NOT NULL,
    "avatarUrl" TEXT NOT NULL,
    "profileUrl" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MessageComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "MessageComment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MessageCommentLike" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "commentId" TEXT NOT NULL,
    "githubLogin" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MessageCommentLike_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "MessageComment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FriendLink" (
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
);

-- CreateTable
CREATE TABLE "FriendLinkApplication" (
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
);

-- CreateIndex
CREATE UNIQUE INDEX "GithubSession_sessionToken_key" ON "GithubSession"("sessionToken");

-- CreateIndex
CREATE INDEX "GithubSession_githubLogin_idx" ON "GithubSession"("githubLogin");

-- CreateIndex
CREATE INDEX "GithubSession_expiresAt_idx" ON "GithubSession"("expiresAt");

-- CreateIndex
CREATE INDEX "MessageComment_parentId_idx" ON "MessageComment"("parentId");

-- CreateIndex
CREATE INDEX "MessageComment_createdAt_idx" ON "MessageComment"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MessageCommentLike_commentId_githubLogin_key" ON "MessageCommentLike"("commentId", "githubLogin");

-- CreateIndex
CREATE INDEX "MessageCommentLike_githubLogin_idx" ON "MessageCommentLike"("githubLogin");

-- CreateIndex
CREATE UNIQUE INDEX "FriendLink_url_key" ON "FriendLink"("url");

-- CreateIndex
CREATE INDEX "FriendLink_isActive_createdAt_idx" ON "FriendLink"("isActive", "createdAt");

-- CreateIndex
CREATE INDEX "FriendLinkApplication_status_expiresAt_idx" ON "FriendLinkApplication"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "FriendLinkApplication_applicantGithubLogin_createdAt_idx" ON "FriendLinkApplication"("applicantGithubLogin", "createdAt");
