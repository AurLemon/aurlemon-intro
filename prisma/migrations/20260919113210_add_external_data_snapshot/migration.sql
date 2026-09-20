-- CreateTable
CREATE TABLE "ExternalDataSnapshot" (
    "cacheKey" TEXT NOT NULL PRIMARY KEY,
    "payloadJson" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
