import { Injectable } from "@nestjs/common";
import type { ReportResult } from "@bsc/shared";
import { col, report, startOfToday } from "../common/report";
import { money } from "../common/resource/resource-mapper";
import { coversDay } from "../bookings/booking-time";
import { PrismaService } from "../prisma/prisma.service";
import { adjustedPrice, applicableRules } from "./pricing";

@Injectable()
export class BookingOpsReportsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Today's slot prices after active peak and dynamic rules. */
  async priceCheck(): Promise<ReportResult> {
    const today = startOfToday();
    const [slots, rules] = await Promise.all([
      this.prisma.slot.findMany({ where: { status: "ACTIVE" }, include: { facility: { select: { name: true } } }, orderBy: [{ facilityId: "asc" }, { timeSlotStart: "asc" }] }),
      this.prisma.pricingRule.findMany({ where: { status: "ACTIVE" } }),
    ]);
    const rows = slots
      .filter((slot) => coversDay(slot.dayOfWeek, today))
      .map((slot) => {
        const applied = applicableRules(rules, slot.facilityId, today, slot.timeSlotStart);
        const base = money(slot.priceBdt);
        return {
          facility: slot.facility.name,
          slot: `${slot.timeSlotStart}-${slot.timeSlotEnd}`,
          base,
          rules: applied.map((rule) => `${rule.name} (${rule.adjustPercent > 0 ? "+" : ""}${rule.adjustPercent}%)`).join(", ") || "None",
          price: adjustedPrice(base, applied),
        };
      });
    return report(
      "Price check · today",
      [col("facility", "Facility"), col("slot", "Slot"), col("base", "Base price", "money"), col("rules", "Rules applied"), col("price", "Price today", "money")],
      rows,
      [
        { label: "Slots today", value: rows.length, kind: "number" },
        { label: "Slots repriced", value: rows.filter((row) => row.price !== row.base).length, kind: "number" },
      ],
    );
  }
}
