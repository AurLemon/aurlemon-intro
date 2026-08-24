-- Replace the mutable handle with a dedicated username while preserving the
-- immutable User.id UUID as the public account identifier.

PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "usernameNormalized" TEXT NOT NULL,
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

INSERT INTO "new_User" ("id", "username", "usernameNormalized", "displayName", "role", "status", "preferredLocale", "preferredAvatarIdentityId", "isLegacyMigrated", "mergedIntoUserId", "createdAt", "updatedAt")
SELECT "id", "handle", "handleNormalized", "displayName", "role", "status", "preferredLocale", "preferredAvatarIdentityId", "isLegacyMigrated", "mergedIntoUserId", "createdAt", "updatedAt"
FROM "User";

DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";

CREATE UNIQUE INDEX "User_usernameNormalized_key" ON "User"("usernameNormalized");
CREATE INDEX "User_status_createdAt_idx" ON "User"("status", "createdAt");
CREATE INDEX "User_mergedIntoUserId_idx" ON "User"("mergedIntoUserId");

PRAGMA foreign_keys=ON;
