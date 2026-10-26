-- AlterTable
ALTER TABLE "facilities" ADD COLUMN     "bufferMinutes" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "slots" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "dayOfWeek" TEXT NOT NULL,
    "timeSlotStart" TEXT NOT NULL,
    "timeSlotEnd" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "priceBdt" DECIMAL(12,2) NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recurring_booking_rules" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "startsOn" DATE NOT NULL,
    "endsOn" DATE NOT NULL,
    "timeSlotStart" TEXT NOT NULL,
    "timeSlotEnd" TEXT NOT NULL,
    "amountBdt" DECIMAL(12,2) NOT NULL,
    "generated" INTEGER NOT NULL DEFAULT 0,
    "skipped" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recurring_booking_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "waitlist_entries" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "preferredDate" DATE NOT NULL,
    "timeSlotStart" TEXT NOT NULL,
    "timeSlotEnd" TEXT NOT NULL,
    "amountBdt" DECIMAL(12,2) NOT NULL,
    "bookingId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "waitlist_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coaches" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sport" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "hourlyRateBdt" DECIMAL(12,2) NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coaches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coach_sessions" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "sessionDate" DATE NOT NULL,
    "timeSlotStart" TEXT NOT NULL,
    "timeSlotEnd" TEXT NOT NULL,
    "amountBdt" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coach_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_add_ons" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "feeBdt" DECIMAL(12,2) NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_add_ons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricing_rules" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "facilityId" TEXT,
    "dayOfWeek" TEXT NOT NULL,
    "startsAt" TEXT NOT NULL,
    "endsAt" TEXT NOT NULL,
    "adjustPercent" INTEGER NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricing_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_deposits" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "amountBdt" DECIMAL(12,2) NOT NULL,
    "method" TEXT NOT NULL,
    "heldOn" DATE NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_deposits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cancellation_policies" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "facilityType" TEXT NOT NULL,
    "hoursBefore" INTEGER NOT NULL,
    "refundPercent" INTEGER NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cancellation_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_payments" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "amountBdt" DECIMAL(12,2) NOT NULL,
    "method" TEXT NOT NULL,
    "gatewayRef" TEXT NOT NULL DEFAULT '',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "venue_layouts" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "venue" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT NOT NULL DEFAULT '',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "venue_layouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stands" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "venueLayoutId" TEXT NOT NULL,
    "gate" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seat_blocks" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "standId" TEXT NOT NULL,
    "rows" INTEGER NOT NULL,
    "seatsPerRow" INTEGER NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seat_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seat_rows" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "seatBlockId" TEXT NOT NULL,
    "seats" INTEGER NOT NULL,
    "accessible" INTEGER NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seat_rows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seat_assignments" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "matchEventId" TEXT NOT NULL,
    "seatRowId" TEXT NOT NULL,
    "seatNo" INTEGER NOT NULL,
    "seatLabel" TEXT NOT NULL DEFAULT '',
    "gate" TEXT NOT NULL DEFAULT '',
    "allocation" TEXT NOT NULL,
    "holder" TEXT NOT NULL DEFAULT '',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seat_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "box_office_tickets" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "matchEventId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "holder" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "priceBdt" DECIMAL(12,2) NOT NULL,
    "seat" TEXT NOT NULL DEFAULT '',
    "host" TEXT NOT NULL DEFAULT '',
    "approvedBy" TEXT NOT NULL DEFAULT '',
    "device" TEXT NOT NULL DEFAULT '',
    "totalBdt" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "box_office_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_allocations" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "matchEventId" TEXT NOT NULL,
    "holderType" TEXT NOT NULL,
    "holder" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "contact" TEXT NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ticket_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "season_passes" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "holder" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "season" TEXT NOT NULL,
    "seat" TEXT NOT NULL DEFAULT '',
    "priceBdt" DECIMAL(12,2) NOT NULL,
    "validUntil" DATE NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "season_passes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promo_codes" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "matchEventId" TEXT,
    "discountPercent" INTEGER NOT NULL,
    "validUntil" DATE NOT NULL,
    "usageLimit" INTEGER NOT NULL,
    "used" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promo_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_changes" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "ticketCategoryId" TEXT NOT NULL,
    "priceBdt" DECIMAL(12,2) NOT NULL,
    "previousBdt" DECIMAL(12,2),
    "reason" TEXT NOT NULL DEFAULT '',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_changes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_transfers" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "ticketOrderId" TEXT NOT NULL,
    "fromHolder" TEXT NOT NULL DEFAULT '',
    "toHolder" TEXT NOT NULL,
    "toMobile" TEXT NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ticket_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_cases" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "ticketOrderId" TEXT NOT NULL,
    "amountBdt" DECIMAL(12,2),
    "reason" TEXT NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ticket_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entry_reviews" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "gateId" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "entry_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "slots_reference_key" ON "slots"("reference");

-- CreateIndex
CREATE INDEX "slots_facilityId_dayOfWeek_idx" ON "slots"("facilityId", "dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "recurring_booking_rules_reference_key" ON "recurring_booking_rules"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "waitlist_entries_reference_key" ON "waitlist_entries"("reference");

-- CreateIndex
CREATE INDEX "waitlist_entries_facilityId_status_idx" ON "waitlist_entries"("facilityId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "coaches_reference_key" ON "coaches"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "coach_sessions_reference_key" ON "coach_sessions"("reference");

-- CreateIndex
CREATE INDEX "coach_sessions_coachId_sessionDate_idx" ON "coach_sessions"("coachId", "sessionDate");

-- CreateIndex
CREATE UNIQUE INDEX "booking_add_ons_reference_key" ON "booking_add_ons"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "pricing_rules_reference_key" ON "pricing_rules"("reference");

-- CreateIndex
CREATE INDEX "pricing_rules_kind_status_idx" ON "pricing_rules"("kind", "status");

-- CreateIndex
CREATE UNIQUE INDEX "booking_deposits_reference_key" ON "booking_deposits"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "cancellation_policies_reference_key" ON "cancellation_policies"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "booking_payments_reference_key" ON "booking_payments"("reference");

-- CreateIndex
CREATE INDEX "booking_payments_bookingId_status_idx" ON "booking_payments"("bookingId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "venue_layouts_reference_key" ON "venue_layouts"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "stands_reference_key" ON "stands"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "seat_blocks_reference_key" ON "seat_blocks"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "seat_rows_reference_key" ON "seat_rows"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "seat_rows_seatBlockId_label_key" ON "seat_rows"("seatBlockId", "label");

-- CreateIndex
CREATE UNIQUE INDEX "seat_assignments_reference_key" ON "seat_assignments"("reference");

-- CreateIndex
CREATE INDEX "seat_assignments_matchEventId_seatRowId_seatNo_idx" ON "seat_assignments"("matchEventId", "seatRowId", "seatNo");

-- CreateIndex
CREATE UNIQUE INDEX "box_office_tickets_reference_key" ON "box_office_tickets"("reference");

-- CreateIndex
CREATE INDEX "box_office_tickets_matchEventId_kind_idx" ON "box_office_tickets"("matchEventId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "ticket_allocations_reference_key" ON "ticket_allocations"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "season_passes_reference_key" ON "season_passes"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "promo_codes_reference_key" ON "promo_codes"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "promo_codes_code_key" ON "promo_codes"("code");

-- CreateIndex
CREATE UNIQUE INDEX "price_changes_reference_key" ON "price_changes"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "ticket_transfers_reference_key" ON "ticket_transfers"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "ticket_cases_reference_key" ON "ticket_cases"("reference");

-- CreateIndex
CREATE INDEX "ticket_cases_kind_status_idx" ON "ticket_cases"("kind", "status");

-- CreateIndex
CREATE UNIQUE INDEX "entry_reviews_reference_key" ON "entry_reviews"("reference");

-- AddForeignKey
ALTER TABLE "slots" ADD CONSTRAINT "slots_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "facilities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_booking_rules" ADD CONSTRAINT "recurring_booking_rules_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "facilities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waitlist_entries" ADD CONSTRAINT "waitlist_entries_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "facilities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coach_sessions" ADD CONSTRAINT "coach_sessions_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "coaches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coach_sessions" ADD CONSTRAINT "coach_sessions_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "facilities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_add_ons" ADD CONSTRAINT "booking_add_ons_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_add_ons" ADD CONSTRAINT "booking_add_ons_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_rules" ADD CONSTRAINT "pricing_rules_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "facilities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_deposits" ADD CONSTRAINT "booking_deposits_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_payments" ADD CONSTRAINT "booking_payments_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stands" ADD CONSTRAINT "stands_venueLayoutId_fkey" FOREIGN KEY ("venueLayoutId") REFERENCES "venue_layouts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seat_blocks" ADD CONSTRAINT "seat_blocks_standId_fkey" FOREIGN KEY ("standId") REFERENCES "stands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seat_rows" ADD CONSTRAINT "seat_rows_seatBlockId_fkey" FOREIGN KEY ("seatBlockId") REFERENCES "seat_blocks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seat_assignments" ADD CONSTRAINT "seat_assignments_matchEventId_fkey" FOREIGN KEY ("matchEventId") REFERENCES "match_events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seat_assignments" ADD CONSTRAINT "seat_assignments_seatRowId_fkey" FOREIGN KEY ("seatRowId") REFERENCES "seat_rows"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "box_office_tickets" ADD CONSTRAINT "box_office_tickets_matchEventId_fkey" FOREIGN KEY ("matchEventId") REFERENCES "match_events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_allocations" ADD CONSTRAINT "ticket_allocations_matchEventId_fkey" FOREIGN KEY ("matchEventId") REFERENCES "match_events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promo_codes" ADD CONSTRAINT "promo_codes_matchEventId_fkey" FOREIGN KEY ("matchEventId") REFERENCES "match_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_changes" ADD CONSTRAINT "price_changes_ticketCategoryId_fkey" FOREIGN KEY ("ticketCategoryId") REFERENCES "ticket_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_transfers" ADD CONSTRAINT "ticket_transfers_ticketOrderId_fkey" FOREIGN KEY ("ticketOrderId") REFERENCES "ticket_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_cases" ADD CONSTRAINT "ticket_cases_ticketOrderId_fkey" FOREIGN KEY ("ticketOrderId") REFERENCES "ticket_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entry_reviews" ADD CONSTRAINT "entry_reviews_gateId_fkey" FOREIGN KEY ("gateId") REFERENCES "gates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
