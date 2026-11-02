ALTER TABLE "FriendLink" ADD COLUMN "ownerLinuxDoUsername" TEXT;

-- Only verified application relations identify an owner; manual creators are administrators.
UPDATE "FriendLink" SET "ownerUserId" = (
  SELECT "applicantUserId" FROM "FriendLinkApplication"
  WHERE "FriendLinkApplication"."id" = "FriendLink"."sourceApplicationId"
) WHERE "origin" = 'APPLICATION' AND "ownerUserId" IS NULL
  AND "ownerGithubLogin" IS NULL AND "sourceApplicationId" IS NOT NULL;
