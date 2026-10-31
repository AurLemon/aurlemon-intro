PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_FriendLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "desc" TEXT NOT NULL,
    "imageBase64" TEXT NOT NULL,
    "iconRounded" BOOLEAN NOT NULL DEFAULT true,
    "ownerUserId" TEXT,
    "ownerGithubLogin" TEXT,
    "desktopCoverImage" BLOB,
    "mobileCoverImage" BLOB,
    "desktopCoverAt" DATETIME,
    "mobileCoverAt" DATETIME,
    "createdByGithubLogin" TEXT NOT NULL,
    "approvedByGithubLogin" TEXT,
    "createdByUserId" TEXT,
    "approvedByUserId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "origin" TEXT NOT NULL DEFAULT 'MANUAL',
    "sourceApplicationId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FriendLink_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FriendLink_sourceApplicationId_fkey" FOREIGN KEY ("sourceApplicationId") REFERENCES "FriendLinkApplication" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FriendLink_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FriendLink_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_FriendLink" ("approvedByGithubLogin", "approvedByUserId", "createdAt", "createdByGithubLogin", "createdByUserId", "desc", "desktopCoverAt", "desktopCoverImage", "id", "imageBase64", "isActive", "mobileCoverAt", "mobileCoverImage", "name", "origin", "sourceApplicationId", "updatedAt", "url") SELECT "approvedByGithubLogin", "approvedByUserId", "createdAt", "createdByGithubLogin", "createdByUserId", "desc", "desktopCoverAt", "desktopCoverImage", "id", "imageBase64", "isActive", "mobileCoverAt", "mobileCoverImage", "name", "origin", "sourceApplicationId", "updatedAt", "url" FROM "FriendLink";
DROP TABLE "FriendLink";
ALTER TABLE "new_FriendLink" RENAME TO "FriendLink";
CREATE UNIQUE INDEX "FriendLink_url_key" ON "FriendLink"("url");
CREATE UNIQUE INDEX "FriendLink_sourceApplicationId_key" ON "FriendLink"("sourceApplicationId");
CREATE INDEX "FriendLink_ownerUserId_idx" ON "FriendLink"("ownerUserId");
CREATE INDEX "FriendLink_isActive_createdAt_idx" ON "FriendLink"("isActive", "createdAt");
CREATE INDEX "FriendLink_createdByUserId_idx" ON "FriendLink"("createdByUserId");
CREATE INDEX "FriendLink_approvedByUserId_idx" ON "FriendLink"("approvedByUserId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
