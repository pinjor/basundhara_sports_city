import { Injectable } from "@nestjs/common";
import type { ReportResult } from "@bsc/shared";
import { col, percent, report, sum } from "../common/report";
import { isoDay, money } from "../common/resource/resource-mapper";
import { PrismaService } from "../prisma/prisma.service";

const OCCUPYING = ["AWAITING_PAYMENT", "PAYMENT_FAILED_RETRY_HOLD", "CONFIRMED", "CANCEL_REQUESTED"];
const SOLD = ["CONFIRMED", "CANCEL_REQUESTED"];

@Injectable()
export class TicketSetupReportsService {
  constructor(private readonly prisma: PrismaService) {}

  private events() {
    return this.prisma.matchEvent.findMany({
      orderBy: { startsAt: "asc" },
      include: {
        sections: { orderBy: { sortOrder: "asc" } },
        categories: true,
        orders: { where: { status: { in: OCCUPYING } }, select: { status: true, items: { select: { sectionId: true } } } },
        boxOfficeTickets: { where: { status: { not: "REVOKED" } }, select: { quantity: true } },
      },
    });
  }

  async catalogue(): Promise<ReportResult> {
    const events = await this.events();
    const rows = events.map((event) => {
      const capacity = sum(event.sections, (section) => section.rows * section.seatsPerRow);
      const online = event.orders.filter((order) => SOLD.includes(order.status)).reduce((total, order) => total + order.items.length, 0);
      const boxOffice = sum(event.boxOfficeTickets, (ticket) => ticket.quantity);
      const prices = event.categories.map((category) => money(category.priceBdt));
      return {
        event: event.title,
        date: isoDay(event.startsAt),
        venue: event.venueName,
        sections: event.sections.length,
        capacity,
        sold: online + boxOffice,
        fromPrice: prices.length ? Math.min(...prices) : null,
        sales: event.salesStatus === "ON_SALE" ? "On sale" : "Closed",
      };
    });
    return report(
      "Ticket catalogue",
      [
        col("event", "Event"),
        col("date", "Date", "date"),
        col("venue", "Venue"),
        col("sections", "Sections", "number"),
        col("capacity", "Capacity", "number"),
        col("sold", "Sold", "number"),
        col("fromPrice", "From", "money"),
        col("sales", "Sales"),
      ],
      rows,
      [
        { label: "Events", value: rows.length, kind: "number" },
        { label: "Tickets sold", value: sum(rows, (row) => row.sold), kind: "number" },
      ],
    );
  }

  async occupancy(): Promise<ReportResult> {
    const events = await this.events();
    const rows = events.flatMap((event) =>
      event.sections.map((section) => {
        const capacity = section.rows * section.seatsPerRow;
        const items = event.orders.flatMap((order) => order.items.filter((item) => item.sectionId === section.id).map(() => order.status));
        const sold = items.filter((status) => SOLD.includes(status)).length;
        const held = items.length - sold;
        return { event: event.title, section: section.name, capacity, sold, held, occupancy: percent(sold + held, capacity) };
      }),
    );
    return report(
      "Occupancy by section",
      [
        col("event", "Event"),
        col("section", "Section"),
        col("capacity", "Capacity", "number"),
        col("sold", "Sold", "number"),
        col("held", "Held", "number"),
        col("occupancy", "Occupancy", "percent"),
      ],
      rows,
      [
        { label: "Seats sold", value: sum(rows, (row) => row.sold), kind: "number" },
        { label: "Overall occupancy", value: percent(sum(rows, (row) => row.sold + row.held), sum(rows, (row) => row.capacity)), kind: "percent" },
      ],
    );
  }
}
