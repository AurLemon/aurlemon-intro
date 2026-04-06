-- AlterTable
ALTER TABLE "MessageComment" ADD COLUMN "isPinned" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "MessageComment_isPinned_createdAt_idx" ON "MessageComment"("isPinned", "createdAt");
