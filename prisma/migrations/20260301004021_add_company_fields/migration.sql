-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "bidId" TEXT,
ADD COLUMN     "cep" TEXT,
ADD COLUMN     "complement" TEXT,
ADD COLUMN     "isCredenciada" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "number" TEXT;

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_bidId_fkey" FOREIGN KEY ("bidId") REFERENCES "bids"("id") ON DELETE SET NULL ON UPDATE CASCADE;
