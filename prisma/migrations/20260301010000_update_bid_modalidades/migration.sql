-- AlterEnum: Recreate BidType enum with new values
-- This migration uses a temporary enum type to safely migrate data

-- Step 1: Create new enum type with all desired values
CREATE TYPE "BidType_new" AS ENUM (
  'CHAMADA_PUBLICA',
  'COMPRA_DIRETA',
  'CONCORRENCIA',
  'CONCURSO',
  'CONVENIO',
  'CONVITE',
  'CREDENCIAMENTO',
  'DISPENSA',
  'INEXIGIBILIDADE',
  'LEILAO',
  'PREGAO',
  'PREGAO_ELETRONICO',
  'RATEIO',
  'TOMADA_PRECOS'
);

-- Step 2: Migrate existing data and alter column
ALTER TABLE "bids" ALTER COLUMN "type" DROP DEFAULT;

-- Update old value to new value using CASE statement
ALTER TABLE "bids" ALTER COLUMN "type" TYPE "BidType_new" 
  USING (
    CASE type::text
      WHEN 'TOMADA_PRECO' THEN 'TOMADA_PRECOS'
      ELSE type::text
    END::"BidType_new"
  );

-- Step 3: Set new default
ALTER TABLE "bids" ALTER COLUMN "type" SET DEFAULT 'PREGAO_ELETRONICO'::"BidType_new";

-- Step 4: Drop old type and rename new one
DROP TYPE "BidType";
ALTER TYPE "BidType_new" RENAME TO "BidType";
