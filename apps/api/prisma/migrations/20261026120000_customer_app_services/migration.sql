-- DropForeignKey
ALTER TABLE "parking_reservations" DROP CONSTRAINT "parking_reservations_eventPackId_fkey";

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "holdExpiresAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "credentials" ADD COLUMN     "customerId" TEXT;

-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "biometricConsent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "consents" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "dob" DATE,
ADD COLUMN     "faceEnrolled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "guardianMobile" TEXT,
ADD COLUMN     "guardianName" TEXT,
ADD COLUMN     "idLast4" TEXT,
ADD COLUMN     "idType" TEXT,
ADD COLUMN     "visitorRef" TEXT;
UPDATE "customers" SET "visitorRef" = gen_random_uuid()::text WHERE "visitorRef" IS NULL;
ALTER TABLE "customers" ALTER COLUMN "visitorRef" SET NOT NULL;

-- AlterTable
ALTER TABLE "facilities" ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "summary" TEXT;

-- AlterTable
ALTER TABLE "lounges" ADD COLUMN     "customerBookable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "summary" TEXT;

-- AlterTable
ALTER TABLE "members" ADD COLUMN     "autoRenew" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "customerId" TEXT,
ADD COLUMN     "employer" TEXT,
ADD COLUMN     "holders" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "planCode" TEXT;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "customerId" TEXT,
ADD COLUMN     "readyAt" TIMESTAMP(3),
ADD COLUMN     "reference" TEXT;

-- AlterTable
ALTER TABLE "parking_reservations" ADD COLUMN     "code" TEXT,
ADD COLUMN     "customerId" TEXT,
ALTER COLUMN "eventPackId" DROP NOT NULL;
UPDATE "parking_reservations" SET "code" = gen_random_uuid()::text WHERE "code" IS NULL;
ALTER TABLE "parking_reservations" ALTER COLUMN "code" SET NOT NULL;

-- AlterTable
ALTER TABLE "service_requests" ADD COLUMN     "arrival" TEXT,
ADD COLUMN     "customerId" TEXT,
ADD COLUMN     "note" TEXT;

-- AlterTable
ALTER TABLE "trips" ADD COLUMN     "boardingCode" TEXT,
ADD COLUMN     "customerId" TEXT,
ADD COLUMN     "riders" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "visitors" ADD COLUMN     "customerId" TEXT,
ADD COLUMN     "visitDate" DATE;

-- CreateTable
CREATE TABLE "customer_notifications" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membership_plans" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "memberTier" TEXT NOT NULL,
    "priceBdt" DECIMAL(12,2) NOT NULL,
    "durationDays" INTEGER NOT NULL DEFAULT 365,
    "perks" JSONB NOT NULL DEFAULT '[]',
    "maxHolders" INTEGER NOT NULL DEFAULT 0,
    "employerBilled" BOOLEAN NOT NULL DEFAULT false,
    "imageUrl" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "membership_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "corporate_accounts" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "corporate_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membership_payments" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "planCode" TEXT NOT NULL,
    "amountBdt" DECIMAL(12,2) NOT NULL,
    "method" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "providerRef" TEXT NOT NULL,
    "sandbox" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "membership_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_items" (
    "id" TEXT NOT NULL,
    "outletId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "priceBdt" DECIMAL(10,2) NOT NULL,
    "station" TEXT NOT NULL DEFAULT '',
    "prepMinutes" INTEGER NOT NULL DEFAULT 12,
    "imageUrl" TEXT,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "customer_notifications_customerId_createdAt_idx" ON "customer_notifications"("customerId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "membership_plans_code_key" ON "membership_plans"("code");

-- CreateIndex
CREATE UNIQUE INDEX "corporate_accounts_code_key" ON "corporate_accounts"("code");

-- CreateIndex
CREATE UNIQUE INDEX "membership_payments_reference_key" ON "membership_payments"("reference");

-- CreateIndex
CREATE INDEX "membership_payments_memberId_idx" ON "membership_payments"("memberId");

-- CreateIndex
CREATE INDEX "menu_items_outletId_idx" ON "menu_items"("outletId");

-- CreateIndex
CREATE INDEX "credentials_customerId_idx" ON "credentials"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "customers_visitorRef_key" ON "customers"("visitorRef");

-- CreateIndex
CREATE UNIQUE INDEX "members_customerId_key" ON "members"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "orders_reference_key" ON "orders"("reference");

-- CreateIndex
CREATE INDEX "orders_customerId_idx" ON "orders"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "parking_reservations_code_key" ON "parking_reservations"("code");

-- CreateIndex
CREATE INDEX "parking_reservations_customerId_idx" ON "parking_reservations"("customerId");

-- CreateIndex
CREATE INDEX "service_requests_customerId_idx" ON "service_requests"("customerId");

-- CreateIndex
CREATE INDEX "trips_customerId_idx" ON "trips"("customerId");

-- CreateIndex
CREATE INDEX "visitors_customerId_idx" ON "visitors"("customerId");

-- AddForeignKey
ALTER TABLE "customer_notifications" ADD CONSTRAINT "customer_notifications_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_payments" ADD CONSTRAINT "membership_payments_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credentials" ADD CONSTRAINT "credentials_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking_reservations" ADD CONSTRAINT "parking_reservations_eventPackId_fkey" FOREIGN KEY ("eventPackId") REFERENCES "event_packs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking_reservations" ADD CONSTRAINT "parking_reservations_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitors" ADD CONSTRAINT "visitors_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "outlets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

