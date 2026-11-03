import { BadRequestException, ConflictException, Injectable, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import type { Member, MembershipPlan, Prisma } from "@prisma/client";
import { MemberStatus } from "@bsc/shared";
import { PrismaService } from "../prisma/prisma.service";
import { IdempotencyService } from "../common/idempotency.service";
import { ReferenceService } from "../common/reference.service";
import type { RequestCustomer } from "../auth/customer-jwt.strategy";
import { CustomerInboxService } from "./customer-inbox.service";
import { assertSandboxPayments, PaymentDeclinedException, sandboxRef } from "./sandbox-payment";
import type { PurchaseMembershipDto, UpdateMembershipDto } from "./dto/customer.dto";

const DAY_MS = 86_400_000;
const CREDENTIAL_TYPE = "Membership";
const CLASS_FACILITIES = ["Gym", "Swimming Pool"];

@Injectable()
export class CustomerMembershipService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly idempotency: IdempotencyService,
    private readonly references: ReferenceService,
    private readonly inbox: CustomerInboxService,
  ) {}

  /** Public catalogue: plans on sale, coaches and the regular gym and pool sessions. */
  async catalog() {
    const [plans, coaches, slots] = await Promise.all([
      this.prisma.membershipPlan.findMany({ where: { active: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
      this.prisma.coach.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" } }),
      this.prisma.slot.findMany({
        where: { status: "ACTIVE", facility: { type: { in: CLASS_FACILITIES } } },
        include: { facility: { select: { name: true } } },
        orderBy: { timeSlotStart: "asc" },
      }),
    ]);
    const classes = [...new Set(slots.map((slot) => `${slot.timeSlotStart} ${slot.facility.name}`))].slice(0, 8);
    return {
      plans: plans.map(presentPlan),
      trainers: coaches.map((coach) => `${coach.name} · ${coach.sport}`),
      classes,
    };
  }

  async view(customerId: string) {
    const member = await this.linked(customerId);
    if (!member) return { member: null };
    const [plan, credential] = await Promise.all([
      member.planCode ? this.prisma.membershipPlan.findUnique({ where: { code: member.planCode } }) : null,
      this.prisma.credential.findFirst({ where: { memberId: member.id, type: CREDENTIAL_TYPE, status: "Active" } }),
    ]);
    const active = member.status === MemberStatus.ACTIVE && member.expiryDate.getTime() > Date.now();
    return {
      member: {
        id: member.id,
        tier: member.tier,
        status: active ? MemberStatus.ACTIVE : member.status === MemberStatus.FROZEN ? MemberStatus.FROZEN : MemberStatus.EXPIRED,
        joinDate: member.joinDate,
        expiryDate: member.expiryDate,
        billingCycle: member.billingCycle,
        checkInCount: member.checkInCount,
        lastCheckIn: member.lastCheckIn,
        planCode: member.planCode,
        plan: plan ? presentPlan(plan) : null,
        autoRenew: member.autoRenew,
        holders: Array.isArray(member.holders) ? member.holders : [],
        employer: member.employer,
        /** Shown as the member QR; only while the membership is active. */
        credentialCode: active ? (credential?.code ?? null) : null,
      },
    };
  }

  /** Requires an `Idempotency-Key`. Extends an active membership, otherwise starts today. */
  purchase(customer: RequestCustomer, dto: PurchaseMembershipDto, key: string | undefined) {
    assertSandboxPayments();
    return this.idempotency.run(`membership-buy:${customer.id}`, key, dto, async () => {
      const plan = await this.prisma.membershipPlan.findFirst({ where: { code: dto.planCode, active: true } });
      if (!plan) throw new NotFoundException("Plan not found");
      if (plan.employerBilled) throw new BadRequestException("Corporate membership is activated with an employer code");
      if (dto.simulateFailure) throw new PaymentDeclinedException();
      const until = await this.prisma.$transaction(async (tx) => {
        const member = await this.ensureMember(tx, customer);
        if (member.status === MemberStatus.FROZEN) throw new ConflictException("This membership is frozen. Visit the members desk.");
        const now = Date.now();
        const from = member.status === MemberStatus.ACTIVE && member.expiryDate.getTime() > now ? member.expiryDate.getTime() : now;
        const expiryDate = new Date(from + plan.durationDays * DAY_MS);
        const updated = await this.activate(tx, member, plan, expiryDate, null, customer);
        await tx.membershipPayment.create({
          data: {
            reference: await this.references.next("MBP", tx),
            memberId: updated.id,
            planCode: plan.code,
            amountBdt: plan.priceBdt,
            method: dto.method,
            status: "CAPTURED",
            providerRef: sandboxRef(),
          },
        });
        return expiryDate;
      });
      await this.inbox.notify(customer.id, "Membership active", `${plan.label} · valid until ${until.toISOString().slice(0, 10)}`);
      return this.view(customer.id);
    });
  }

  async activateCorporate(customer: RequestCustomer, code: string) {
    const account = await this.prisma.corporateAccount.findFirst({ where: { code: code.trim().toUpperCase(), active: true } });
    if (!account) throw new NotFoundException("That employer code is not recognised");
    const plan = await this.prisma.membershipPlan.findFirst({ where: { employerBilled: true, active: true }, orderBy: { sortOrder: "asc" } });
    if (!plan) throw new ServiceUnavailableException("Corporate membership is not on offer right now");
    const until = await this.prisma.$transaction(async (tx) => {
      const member = await this.ensureMember(tx, customer);
      const active = member.status === MemberStatus.ACTIVE && member.expiryDate.getTime() > Date.now();
      if (active && member.planCode === plan.code && member.employer === account.name) {
        throw new ConflictException(`Corporate membership with ${account.name} is already active`);
      }
      const expiryDate = new Date(Date.now() + plan.durationDays * DAY_MS);
      await this.activate(tx, member, plan, expiryDate, account.name, customer);
      return expiryDate;
    });
    await this.inbox.notify(customer.id, "Membership active", `${plan.label} · ${account.name} · valid until ${until.toISOString().slice(0, 10)}`);
    return this.view(customer.id);
  }

  async update(customerId: string, dto: UpdateMembershipDto) {
    const member = await this.linked(customerId);
    if (!member) throw new NotFoundException("No membership on this account");
    let holders: string[] | undefined;
    if (dto.holders) {
      const plan = member.planCode ? await this.prisma.membershipPlan.findUnique({ where: { code: member.planCode } }) : null;
      const limit = plan?.maxHolders ?? 0;
      holders = [...new Set(dto.holders.map((name) => name.trim()).filter(Boolean))];
      if (holders.length > limit) {
        throw new BadRequestException(limit === 0 ? "This plan cannot be shared" : `This plan can be shared with up to ${limit} people`);
      }
    }
    await this.prisma.member.update({ where: { id: member.id }, data: { autoRenew: dto.autoRenew, holders } });
    return this.view(customerId);
  }

  /** The member record for this customer, linking a desk-created one with the same email and mobile. */
  private async linked(customerId: string, tx: Prisma.TransactionClient = this.prisma): Promise<Member | null> {
    const own = await tx.member.findUnique({ where: { customerId } });
    if (own) return own;
    const customer = await tx.customer.findUniqueOrThrow({ where: { id: customerId } });
    const member = await tx.member.findUnique({ where: { email: customer.email } });
    if (!member || member.customerId || normaliseMobile(member.phone) !== customer.mobile) return null;
    return tx.member.update({ where: { id: member.id }, data: { customerId } });
  }

  private async ensureMember(tx: Prisma.TransactionClient, customer: RequestCustomer): Promise<Member> {
    const existing = await this.linked(customer.id, tx);
    if (existing) return existing;
    if (await tx.member.findUnique({ where: { email: customer.email } })) {
      throw new ConflictException("This email is already on another membership. Visit the members desk to link it.");
    }
    return tx.member.create({
      data: {
        name: customer.name,
        email: customer.email,
        phone: customer.mobile,
        tier: "Individual",
        status: MemberStatus.EXPIRED,
        expiryDate: new Date(),
        customerId: customer.id,
      },
    });
  }

  private async activate(
    tx: Prisma.TransactionClient,
    member: Member,
    plan: MembershipPlan,
    expiryDate: Date,
    employer: string | null,
    customer: RequestCustomer,
  ) {
    const updated = await tx.member.update({
      where: { id: member.id },
      data: {
        tier: plan.memberTier,
        planCode: plan.code,
        status: MemberStatus.ACTIVE,
        expiryDate,
        billingCycle: "Annual",
        employer,
        holders: plan.maxHolders > 0 && Array.isArray(member.holders) ? (member.holders as Prisma.InputJsonValue) : [],
        autoRenew: employer ? false : member.autoRenew,
      },
    });
    const credential = await tx.credential.findFirst({ where: { memberId: member.id, type: CREDENTIAL_TYPE } });
    if (credential) {
      await tx.credential.update({ where: { id: credential.id }, data: { status: "Active", validTo: expiryDate, customerId: customer.id } });
    } else {
      await tx.credential.create({
        data: { holderRef: customer.name, type: CREDENTIAL_TYPE, memberId: member.id, customerId: customer.id, validTo: expiryDate },
      });
    }
    return updated;
  }
}

function presentPlan(plan: MembershipPlan) {
  return {
    code: plan.code,
    name: plan.name,
    label: plan.label,
    tier: plan.memberTier,
    price: Number(plan.priceBdt),
    durationDays: plan.durationDays,
    perks: Array.isArray(plan.perks) ? plan.perks : [],
    maxHolders: plan.maxHolders,
    employerBilled: plan.employerBilled,
    imageUrl: plan.imageUrl,
  };
}

/** "+880 1712-345678" and "01712345678" are the same number. */
function normaliseMobile(phone: string | null): string | null {
  const digits = phone?.replace(/\D/g, "") ?? "";
  if (!digits) return null;
  return digits.startsWith("880") ? `0${digits.slice(3)}` : digits;
}
