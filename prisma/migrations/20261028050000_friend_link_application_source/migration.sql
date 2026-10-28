-- Preserve an explicit source without changing existing friend-link content.
ALTER TABLE "FriendLink" ADD COLUMN "origin" TEXT NOT NULL DEFAULT 'MANUAL';
ALTER TABLE "FriendLink" ADD COLUMN "sourceApplicationId" TEXT REFERENCES "FriendLinkApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE UNIQUE INDEX "FriendLink_sourceApplicationId_key" ON "FriendLink"("sourceApplicationId");

UPDATE "FriendLink" SET "origin" = 'UNKNOWN';
UPDATE "FriendLink" SET "origin" = 'MANUAL'
WHERE EXISTS (
  SELECT 1 FROM "DomainEventOutbox" e
  WHERE e."eventType" = 'friend-link.created' AND e."aggregateId" = "FriendLink"."id"
);

-- A legacy application can be linked only when the URL, applicant and approval
-- timestamp agree and exactly one record matches. Ambiguous history stays unknown.
UPDATE "FriendLink" SET "sourceApplicationId" = (
  SELECT a."id" FROM "FriendLinkApplication" a
  WHERE a."status" = 'approved' AND a."url" = "FriendLink"."url"
    AND (a."applicantUserId" = "FriendLink"."createdByUserId"
      OR (a."applicantGithubLogin" <> '' AND a."applicantGithubLogin" = "FriendLink"."createdByGithubLogin"))
    AND typeof(a."approvedAt") = 'integer' AND typeof("FriendLink"."createdAt") = 'integer'
    AND "FriendLink"."createdAt" - a."approvedAt" BETWEEN -1000 AND 60000
)
WHERE "origin" = 'UNKNOWN' AND 1 = (
  SELECT COUNT(*) FROM "FriendLinkApplication" a
  WHERE a."status" = 'approved' AND a."url" = "FriendLink"."url"
    AND (a."applicantUserId" = "FriendLink"."createdByUserId"
      OR (a."applicantGithubLogin" <> '' AND a."applicantGithubLogin" = "FriendLink"."createdByGithubLogin"))
    AND typeof(a."approvedAt") = 'integer' AND typeof("FriendLink"."createdAt") = 'integer'
    AND "FriendLink"."createdAt" - a."approvedAt" BETWEEN -1000 AND 60000
);
UPDATE "FriendLink" SET "origin" = 'APPLICATION' WHERE "sourceApplicationId" IS NOT NULL;
