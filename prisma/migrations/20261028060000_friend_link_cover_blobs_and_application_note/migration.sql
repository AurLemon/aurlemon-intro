-- Store generated screenshots with their friend link; preserve existing content.
ALTER TABLE "FriendLink" ADD COLUMN "desktopCoverImage" BLOB;
ALTER TABLE "FriendLink" ADD COLUMN "mobileCoverImage" BLOB;
ALTER TABLE "FriendLink" ADD COLUMN "desktopCoverAt" DATETIME;
ALTER TABLE "FriendLink" ADD COLUMN "mobileCoverAt" DATETIME;
ALTER TABLE "FriendLinkApplication" ADD COLUMN "note" TEXT;
