import { Injectable, NotFoundException } from "@nestjs/common";
import { AccessMethod, AccessResult, BookingStatus, GateStatus, GateType, MemberStatus } from "@bsc/shared";
import { PrismaService } from "../prisma/prisma.service";
import type { RequestCustomer } from "../auth/customer-jwt.strategy";
import type { CustomerGateScanDto } from "./dto/customer.dto";

const DHAKA_OFFSET_MS = 6 * 60 * 60 * 1000;
const EARLY_ENTRY_MS = 30 * 60 * 1000;
const EVENT_WINDOW_MS = 4 * 60 * 60 * 1000;
const PREMIUM_CATEGORIES = ["vip", "vvip", "corporate"];
const METHOD: Record<string, string> = { QR: AccessMethod.QR, NFC: AccessMethod.RFID, Face: AccessMethod.FACE };

interface Decision {
  allowed: boolean;
  reason: string;
  /** Written to the access log so staff see which credential was shown. */
  credentialRef?: string;
}

const allow = (credentialRef?: string): Decision => ({ allowed: true, reason: "OK", credentialRef });
const deny = (reason: string, credentialRef?: string): Decision => ({ allowed: false, reason, credentialRef });

/** A customer presents a membership, booking, ticket or pass at a gate; the server decides and logs it. */
@Injectable()
export class CustomerAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async scan(customer: RequestCustomer, dto: CustomerGateScanDto) {
    const gate = await this.prisma.gate.findUnique({ where: { id: dto.gateId } });
    if (!gate) throw new NotFoundException("Gate not found");
    const account = await this.prisma.customer.findUniqueOrThrow({ where: { id: customer.id }, select: { visitorRef: true } });

    const decision =
      gate.status !== GateStatus.ONLINE ? deny("GATE_OFFLINE") : await this.decide(customer.id, gate.type, dto);

    await this.prisma.accessLogEntry.create({
      data: {
        gateId: gate.id,
        personRef: account.visitorRef,
        credentialRef: decision.credentialRef,
        method: METHOD[dto.method] ?? AccessMethod.QR,
        result: decision.allowed ? AccessResult.APPROVED : AccessResult.DENIED,
        reason: decision.allowed ? undefined : decision.reason,
      },
    });
    if (decision.allowed) await this.prisma.gate.update({ where: { id: gate.id }, data: { entriesToday: { increment: 1 } } });
    return { allowed: decision.allowed, reason: decision.reason, gate: { id: gate.id, name: gate.name, kind: gate.type }, at: new Date() };
  }

  /** The customer's own gate history, newest first. */
  async history(customerId: string) {
    const account = await this.prisma.customer.findUniqueOrThrow({ where: { id: customerId }, select: { visitorRef: true } });
    const rows = await this.prisma.accessLogEntry.findMany({
      where: { personRef: account.visitorRef },
      include: { gate: { select: { id: true, name: true, type: true } } },
      orderBy: { timestamp: "desc" },
      take: 30,
    });
    return rows.map((row) => ({
      id: row.id,
      gate: row.gate.name,
      zone: row.gate.type === GateType.VIP ? "VIP" : "Public",
      method: row.method === AccessMethod.RFID ? "NFC" : row.method,
      allowed: row.result === AccessResult.APPROVED,
      at: row.timestamp,
    }));
  }

  private decide(customerId: string, gateType: string, dto: CustomerGateScanDto): Promise<Decision> {
    switch (dto.kind) {
      case "membership":
        return this.membership(customerId, gateType);
      case "booking":
        return this.booking(customerId, gateType, dto.credentialId ?? "");
      case "ticket":
        return this.ticket(customerId, dto.credentialId ?? "", dto.gateId);
      default:
        return this.pass(customerId, gateType, dto.credentialId ?? "");
    }
  }

  private async membership(customerId: string, gateType: string): Promise<Decision> {
    const member = await this.prisma.member.findUnique({ where: { customerId } });
    if (!member) return deny("NO_MEMBERSHIP");
    if (member.status !== MemberStatus.ACTIVE || member.expiryDate.getTime() < Date.now()) return deny("MEMBERSHIP_EXPIRED", member.id);
    if (gateType === GateType.VIP) return deny("ZONE", member.id);
    await this.prisma.member.update({ where: { id: member.id }, data: { checkInCount: { increment: 1 }, lastCheckIn: new Date() } });
    return allow(member.id);
  }

  /** A paid session: valid from 30 minutes before it starts until it ends, once. */
  private async booking(customerId: string, gateType: string, id: string): Promise<Decision> {
    const booking = await this.prisma.booking.findFirst({ where: { id, customerId } });
    if (!booking) return deny("NOT_VALID");
    if (booking.status === BookingStatus.COMPLETED) return deny("REPLAY", booking.qrConfirmationCode);
    if (booking.status !== BookingStatus.CONFIRMED) return deny("NOT_VALID", booking.qrConfirmationCode);
    if (gateType === GateType.VIP) return deny("ZONE", booking.qrConfirmationCode);
    const day = booking.date.toISOString().slice(0, 10);
    const at = (hm: string) => Date.parse(`${day}T${hm}:00.000Z`) - DHAKA_OFFSET_MS;
    const start = at(booking.timeSlotStart);
    let end = at(booking.timeSlotEnd);
    if (end <= start) end += 24 * 60 * 60 * 1000;
    const now = Date.now();
    if (now < start - EARLY_ENTRY_MS) return deny("NOT_YET_VALID", booking.qrConfirmationCode);
    if (now > end) return deny("EXPIRED", booking.qrConfirmationCode);
    await this.prisma.booking.update({ where: { id: booking.id }, data: { status: BookingStatus.COMPLETED } });
    return allow(booking.qrConfirmationCode);
  }

  /** An event seat: right gate, doors open, not used, not revoked. Premium gates need a premium category. */
  private async ticket(customerId: string, id: string, gateId: string): Promise<Decision> {
    const ticket = await this.prisma.issuedTicket.findFirst({
      where: { id, order: { customerId, status: "CONFIRMED" } },
      include: { order: { include: { event: true } }, item: true },
    });
    if (!ticket) return deny("NOT_VALID");
    const gate = await this.prisma.gate.findUniqueOrThrow({ where: { id: gateId } });
    const event = ticket.order.event;
    const ref = ticket.id;
    if (ticket.status === "REVOKED") return deny("CREDENTIAL_REVOKED", ref);
    if (ticket.status === "USED") return deny("REPLAY", ref);
    if (gate.name.toLowerCase() !== ticket.gateName.toLowerCase()) return deny("WRONG_GATE", ref);
    if (gate.type === GateType.VIP) {
      const category = await this.prisma.ticketCategory.findFirst({ where: { sectionId: ticket.item.sectionId } });
      if (!category || !PREMIUM_CATEGORIES.includes(category.name.toLowerCase())) return deny("ZONE", ref);
    }
    const now = Date.now();
    if (now < event.doorsAt.getTime()) return deny("NOT_YET_VALID", ref);
    if (now > event.startsAt.getTime() + EVENT_WINDOW_MS) return deny("EXPIRED", ref);
    await this.prisma.issuedTicket.update({ where: { id: ticket.id }, data: { status: "USED", usedAt: new Date() } });
    return allow(ref);
  }

  /** Free passes allow re-entry until their window closes. */
  private async pass(customerId: string, gateType: string, id: string): Promise<Decision> {
    const pass = await this.prisma.credential.findFirst({ where: { id, customerId } });
    if (!pass) return deny("NOT_VALID");
    if (pass.status !== "Active") return deny(`CREDENTIAL_${pass.status.toUpperCase()}`, pass.code);
    const now = Date.now();
    if (now < pass.validFrom.getTime()) return deny("NOT_YET_VALID", pass.code);
    if (pass.validTo && now > pass.validTo.getTime()) return deny("EXPIRED", pass.code);
    if (gateType === GateType.VIP) return deny("ZONE", pass.code);
    return allow(pass.code);
  }
}
