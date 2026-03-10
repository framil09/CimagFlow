-- CreateEnum
CREATE TYPE "MinuteStatus" AS ENUM ('RASCUNHO', 'APROVADA', 'PUBLICADA', 'ARQUIVADA');

-- CreateEnum
CREATE TYPE "MinuteType" AS ENUM ('ORDINARIA', 'EXTRAORDINARIA', 'ESPECIAL', 'SOLENE');

-- CreateTable
CREATE TABLE "minutes_of_meeting" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "MinuteType" NOT NULL DEFAULT 'ORDINARIA',
    "status" "MinuteStatus" NOT NULL DEFAULT 'RASCUNHO',
    "meetingDate" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "location" TEXT,
    "participants" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "content" TEXT,
    "decisions" TEXT,
    "attachments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "prefectureId" TEXT,
    "bidId" TEXT,
    "createdBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "minutes_of_meeting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "minutes_of_meeting_number_key" ON "minutes_of_meeting"("number");

-- CreateIndex
CREATE INDEX "minutes_of_meeting_number_idx" ON "minutes_of_meeting"("number");

-- CreateIndex
CREATE INDEX "minutes_of_meeting_status_idx" ON "minutes_of_meeting"("status");

-- CreateIndex
CREATE INDEX "minutes_of_meeting_prefectureId_idx" ON "minutes_of_meeting"("prefectureId");

-- CreateIndex
CREATE INDEX "minutes_of_meeting_meetingDate_idx" ON "minutes_of_meeting"("meetingDate");

-- AddForeignKey
ALTER TABLE "minutes_of_meeting" ADD CONSTRAINT "minutes_of_meeting_prefectureId_fkey" FOREIGN KEY ("prefectureId") REFERENCES "prefectures"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "minutes_of_meeting" ADD CONSTRAINT "minutes_of_meeting_bidId_fkey" FOREIGN KEY ("bidId") REFERENCES "bids"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "minutes_of_meeting" ADD CONSTRAINT "minutes_of_meeting_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "minutes_of_meeting" ADD CONSTRAINT "minutes_of_meeting_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
