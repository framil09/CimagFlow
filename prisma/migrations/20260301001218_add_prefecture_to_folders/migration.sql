-- AlterTable
ALTER TABLE "folders" ADD COLUMN     "prefectureId" TEXT;

-- AddForeignKey
ALTER TABLE "folders" ADD CONSTRAINT "folders_prefectureId_fkey" FOREIGN KEY ("prefectureId") REFERENCES "prefectures"("id") ON DELETE SET NULL ON UPDATE CASCADE;
