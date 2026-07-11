-- Fakturauppgifter på verkstaden (avsändare på arbetsorder/faktura)
ALTER TABLE "organizations"
  ADD COLUMN "orgNumber" TEXT,
  ADD COLUMN "vatNumber" TEXT,
  ADD COLUMN "address" TEXT,
  ADD COLUMN "postalCode" TEXT,
  ADD COLUMN "email" TEXT,
  ADD COLUMN "phone" TEXT,
  ADD COLUMN "bankgiro" TEXT,
  ADD COLUMN "paymentTermsDays" INTEGER NOT NULL DEFAULT 30;
