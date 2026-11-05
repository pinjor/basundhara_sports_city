-- CreateTable
CREATE TABLE "shuttle_stops" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "zone" TEXT NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "icon" TEXT NOT NULL DEFAULT 'plaza',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shuttle_stops_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "shuttle_stops_code_key" ON "shuttle_stops"("code");

-- Starting stops (campus configuration, not demo data)
INSERT INTO "shuttle_stops" ("id", "code", "name", "zone", "x", "y", "icon", "sortOrder", "updatedAt") VALUES
  (gen_random_uuid()::text, 'main-gate', 'Main Gate', 'Entry', 0.48, 0.88, 'gate', 0, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'stadium', 'National Stadium', 'Bowl', 0.31, 0.4, 'stadium', 1, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'pitch', 'Training pitches', 'Turf', 0.22, 0.52, 'pitch', 2, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'pool', 'Aquatic centre', 'Pool', 0.65, 0.32, 'pool', 3, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'skyline', 'Skyline kitchen', 'Food', 0.6, 0.52, 'food', 4, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'hotel', 'Athlete Hotel', 'Stay', 0.92, 0.66, 'hotel', 5, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'lounge', 'Champions Lounge', 'Lounge', 0.38, 0.26, 'lounge', 6, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'parking', 'North parking', 'Park', 0.08, 0.24, 'parking', 7, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'plaza', 'Central plaza', 'Hub', 0.48, 0.52, 'plaza', 8, CURRENT_TIMESTAMP);
