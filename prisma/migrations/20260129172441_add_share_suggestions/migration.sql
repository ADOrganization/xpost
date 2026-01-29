-- CreateEnum
CREATE TYPE "SuggestionStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateTable
CREATE TABLE "ShareSuggestion" (
    "id" TEXT NOT NULL,
    "shareLinkId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "threadItemPosition" INTEGER NOT NULL,
    "suggestedText" TEXT NOT NULL,
    "note" TEXT,
    "status" "SuggestionStatus" NOT NULL DEFAULT 'PENDING',
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShareSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ShareSuggestion_shareLinkId_idx" ON "ShareSuggestion"("shareLinkId");

-- CreateIndex
CREATE INDEX "ShareSuggestion_shareLinkId_threadItemPosition_idx" ON "ShareSuggestion"("shareLinkId", "threadItemPosition");

-- AddForeignKey
ALTER TABLE "ShareSuggestion" ADD CONSTRAINT "ShareSuggestion_shareLinkId_fkey" FOREIGN KEY ("shareLinkId") REFERENCES "ShareLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareSuggestion" ADD CONSTRAINT "ShareSuggestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
