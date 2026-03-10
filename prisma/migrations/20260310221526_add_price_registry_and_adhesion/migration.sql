-- CreateEnum
CREATE TYPE "AdhesionStatus" AS ENUM ('PENDENTE', 'APROVADA', 'REJEITADA', 'CANCELADA');

-- AlterTable
ALTER TABLE "minutes_of_meeting" ADD COLUMN     "allowAdhesion" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPriceRegistry" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "items" TEXT,
ADD COLUMN     "priceValue" DOUBLE PRECISION,
ADD COLUMN     "validityEndDate" TIMESTAMP(3),
ADD COLUMN     "validityStartDate" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "minute_adhesions" (
    "id" TEXT NOT NULL,
    "minuteId" TEXT NOT NULL,
    "requesterName" TEXT NOT NULL,
    "requesterEmail" TEXT NOT NULL,
    "requesterPhone" TEXT,
    "requesterCpf" TEXT,
    "requesterCnpj" TEXT,
    "companyName" TEXT,
    "position" TEXT,
    "status" "AdhesionStatus" NOT NULL DEFAULT 'PENDENTE',
    "requestDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "justification" TEXT,
    "attachments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewComment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "minute_adhesions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "minute_adhesions_minuteId_idx" ON "minute_adhesions"("minuteId");

-- CreateIndex
CREATE INDEX "minute_adhesions_status_idx" ON "minute_adhesions"("status");

-- CreateIndex
CREATE INDEX "minute_adhesions_requesterEmail_idx" ON "minute_adhesions"("requesterEmail");

-- CreateIndex
CREATE INDEX "minutes_of_meeting_isPriceRegistry_idx" ON "minutes_of_meeting"("isPriceRegistry");

-- CreateIndex
CREATE INDEX "minutes_of_meeting_isPublic_idx" ON "minutes_of_meeting"("isPublic");

-- AddForeignKey
ALTER TABLE "minute_adhesions" ADD CONSTRAINT "minute_adhesions_minuteId_fkey" FOREIGN KEY ("minuteId") REFERENCES "minutes_of_meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "minute_adhesions" ADD CONSTRAINT "minute_adhesions_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
