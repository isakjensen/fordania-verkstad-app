-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "orgNumber" TEXT,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'private';

-- CreateTable
CREATE TABLE "work_order_images" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "caption" TEXT,
    "uploadedByName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "work_order_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_order_image_vehicles" (
    "id" TEXT NOT NULL,
    "imageId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "work_order_image_vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_contacts" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "work_order_images_organizationId_idx" ON "work_order_images"("organizationId");

-- CreateIndex
CREATE INDEX "work_order_images_jobId_idx" ON "work_order_images"("jobId");

-- CreateIndex
CREATE INDEX "work_order_image_vehicles_imageId_idx" ON "work_order_image_vehicles"("imageId");

-- CreateIndex
CREATE INDEX "work_order_image_vehicles_vehicleId_idx" ON "work_order_image_vehicles"("vehicleId");

-- CreateIndex
CREATE UNIQUE INDEX "work_order_image_vehicles_imageId_vehicleId_key" ON "work_order_image_vehicles"("imageId", "vehicleId");

-- CreateIndex
CREATE INDEX "customer_contacts_customerId_idx" ON "customer_contacts"("customerId");

-- AddForeignKey
ALTER TABLE "work_order_images" ADD CONSTRAINT "work_order_images_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_images" ADD CONSTRAINT "work_order_images_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_image_vehicles" ADD CONSTRAINT "work_order_image_vehicles_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "work_order_images"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_image_vehicles" ADD CONSTRAINT "work_order_image_vehicles_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_contacts" ADD CONSTRAINT "customer_contacts_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
