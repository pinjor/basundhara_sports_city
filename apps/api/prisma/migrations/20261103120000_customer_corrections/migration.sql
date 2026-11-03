-- CreateTable
CREATE TABLE "customer_corrections" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RECEIVED',
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_corrections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "customer_corrections_reference_key" ON "customer_corrections"("reference");

-- CreateIndex
CREATE INDEX "customer_corrections_customerId_createdAt_idx" ON "customer_corrections"("customerId", "createdAt");

-- CreateIndex
CREATE INDEX "customer_corrections_status_idx" ON "customer_corrections"("status");

-- AddForeignKey
ALTER TABLE "customer_corrections" ADD CONSTRAINT "customer_corrections_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
