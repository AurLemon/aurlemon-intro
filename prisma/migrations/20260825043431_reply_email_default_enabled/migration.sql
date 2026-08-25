-- Keep existing notification choices while enabling reply emails by default
-- for notification preferences created after this migration.
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_UserNotificationPreference" (
    "userId" TEXT NOT NULL PRIMARY KEY,
    "replyEmailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "adminCommentEmailEnabled" BOOLEAN NOT NULL DEFAULT false,
    "adminFriendLinkEmailEnabled" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "UserNotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "new_UserNotificationPreference" (
    "userId",
    "replyEmailEnabled",
    "adminCommentEmailEnabled",
    "adminFriendLinkEmailEnabled"
)
SELECT
    "userId",
    "replyEmailEnabled",
    "adminCommentEmailEnabled",
    "adminFriendLinkEmailEnabled"
FROM "UserNotificationPreference";

DROP TABLE "UserNotificationPreference";
ALTER TABLE "new_UserNotificationPreference" RENAME TO "UserNotificationPreference";

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
