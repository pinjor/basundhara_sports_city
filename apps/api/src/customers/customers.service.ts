import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import type { Customer, Prisma } from "@prisma/client";
import type { CustomerAuthResponseDto, CustomerDto, TokenPairDto } from "@bsc/shared";
import { PrismaService } from "../prisma/prisma.service";
import { TokenService, type Subject } from "../auth/token.service";
import { randomBytes, randomInt } from "node:crypto";
import type { ChangePasswordDto, CustomerCorrectionDto, CustomerIdentityDto, RegisterCustomerDto, UpdateCustomerDto } from "./dto/customer.dto";

/** Compared against when the account is unknown, so response time does not reveal which emails exist. */
const DUMMY_HASH = bcrypt.hashSync("no-such-account", 10);
const MIN_AGE = 13;
const ADULT_AGE = 18;

@Injectable()
export class CustomersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
  ) {}

  async register(dto: RegisterCustomerDto, userAgent?: string): Promise<CustomerAuthResponseDto> {
    const email = dto.email.trim().toLowerCase();
    await this.assertAvailable(email, dto.mobile);
    const customer = await this.prisma.customer.create({
      data: {
        name: dto.name.trim(),
        email,
        mobile: dto.mobile,
        passwordHash: await bcrypt.hash(dto.password, 10),
        ...identity(dto, null),
      },
    });
    return this.session(customer, userAgent);
  }

  async login(login: string, password: string, userAgent?: string): Promise<CustomerAuthResponseDto> {
    const key = login.trim().toLowerCase();
    const customer = await this.prisma.customer.findFirst({ where: key.includes("@") ? { email: key } : { mobile: key } });
    const valid = await bcrypt.compare(password, customer?.passwordHash ?? DUMMY_HASH);
    if (!customer || !customer.active || !valid) throw new UnauthorizedException("Invalid credentials");
    return this.session(customer, userAgent);
  }

  refresh(refreshToken: string, userAgent?: string): Promise<TokenPairDto> {
    return this.tokens.rotate(
      refreshToken,
      "customer",
      async (id) => {
        const customer = await this.prisma.customer.findUnique({ where: { id } });
        return customer?.active ? this.subject(customer) : null;
      },
      userAgent,
    );
  }

  logout(refreshToken: string) {
    return this.tokens.revoke(refreshToken, "customer");
  }

  async profile(id: string): Promise<CustomerDto> {
    return present(await this.prisma.customer.findUniqueOrThrow({ where: { id } }));
  }

  async update(id: string, dto: UpdateCustomerDto): Promise<CustomerDto> {
    const email = dto.email?.trim().toLowerCase();
    await this.assertAvailable(email, dto.mobile, id);
    const current = await this.prisma.customer.findUniqueOrThrow({ where: { id } });
    const data = identity(dto, current);
    const consented = data.biometricConsent ?? current.biometricConsent;
    if (dto.faceEnrolled && !consented) throw new BadRequestException("Face entry needs biometric consent first");
    const customer = await this.prisma.customer.update({
      where: { id },
      data: {
        name: dto.name?.trim(),
        email,
        mobile: dto.mobile,
        ...data,
        faceEnrolled: consented ? dto.faceEnrolled : false,
      },
    });
    return present(customer);
  }

  /** Signs every device out; the caller gets a fresh session for this one. */
  async changePassword(id: string, dto: ChangePasswordDto, userAgent?: string): Promise<CustomerAuthResponseDto> {
    const customer = await this.prisma.customer.findUniqueOrThrow({ where: { id } });
    if (!(await bcrypt.compare(dto.currentPassword, customer.passwordHash))) throw new UnauthorizedException("Current password is wrong");
    const updated = await this.prisma.customer.update({ where: { id }, data: { passwordHash: await bcrypt.hash(dto.newPassword, 10) } });
    await this.tokens.revokeAll("customer", id);
    return this.session(updated, userAgent);
  }

  /** A request to fix name, ID or date of birth. Front desk reviews it; the customer gets a reference. */
  async requestCorrection(id: string, dto: CustomerCorrectionDto) {
    const row = await this.prisma.customerCorrection.create({
      data: { customerId: id, field: dto.field, detail: dto.detail.trim(), reference: `CR-${randomInt(100000, 1000000)}` },
    });
    await this.prisma.customerNotification.create({
      data: { customerId: id, title: "Correction request received", body: `${row.reference} · ${dto.field}. We reply within 7 days.` },
    });
    return presentCorrection(row);
  }

  async corrections(id: string) {
    const rows = await this.prisma.customerCorrection.findMany({ where: { customerId: id }, orderBy: { createdAt: "desc" }, take: 20 });
    return rows.map(presentCorrection);
  }

  /**
   * Closes the account: personal details are wiped and every device is signed out. Bookings, orders and
   * payments stay (finance records) but no longer point at a person.
   */
  async deleteAccount(id: string): Promise<void> {
    const tag = id.replace(/-/g, "").slice(0, 12);
    await this.prisma.$transaction([
      this.prisma.customerNotification.deleteMany({ where: { customerId: id } }),
      this.prisma.customerCorrection.deleteMany({ where: { customerId: id } }),
      this.prisma.customer.update({
        where: { id },
        data: {
          active: false,
          name: "Deleted customer",
          email: `deleted-${tag}@deleted.invalid`,
          mobile: `deleted-${tag}`,
          passwordHash: await bcrypt.hash(randomBytes(24).toString("hex"), 10),
          idType: null,
          idLast4: null,
          dob: null,
          guardianName: null,
          guardianMobile: null,
          biometricConsent: false,
          faceEnrolled: false,
        },
      }),
    ]);
    await this.tokens.revokeAll("customer", id);
  }

  private async session(customer: Customer, userAgent?: string): Promise<CustomerAuthResponseDto> {
    const pair = await this.tokens.issue(this.subject(customer), userAgent);
    return { ...pair, customer: present(customer) };
  }

  private subject(customer: Customer): Subject {
    return { type: "customer", id: customer.id };
  }

  private async assertAvailable(email: string | undefined, mobile: string | undefined, exceptId?: string) {
    if (!email && !mobile) return;
    const taken = await this.prisma.customer.findFirst({
      where: {
        OR: [...(email ? [{ email }] : []), ...(mobile ? [{ mobile }] : [])],
        ...(exceptId ? { id: { not: exceptId } } : {}),
      },
      select: { email: true },
    });
    if (taken) throw new ConflictException(taken.email === email ? "An account with this email already exists" : "An account with this mobile number already exists");
  }
}

/**
 * Validated identity fields for a create or update. Applies the age rules: at least 13, a guardian for
 * under-18s, and no biometric entry for minors.
 */
function identity(dto: CustomerIdentityDto, current: Customer | null) {
  const dob = dto.dob ? new Date(`${dto.dob.slice(0, 10)}T00:00:00.000Z`) : (current?.dob ?? null);
  const age = dob ? ageOn(dob, new Date()) : null;
  if (age !== null && (age < 0 || age > 120)) throw new BadRequestException("Date of birth is not valid");
  if (age !== null && age < MIN_AGE) throw new BadRequestException(`Account holders must be at least ${MIN_AGE}`);
  const minor = age !== null && age < ADULT_AGE;
  const guardianName = dto.guardianName?.trim() ?? current?.guardianName ?? null;
  const guardianMobile = dto.guardianMobile ?? current?.guardianMobile ?? null;
  if (minor && (!guardianName || !guardianMobile)) throw new BadRequestException("Under-18s need a parent or guardian's name and mobile");
  if (minor && dto.biometricConsent) throw new BadRequestException("Biometric entry is not available for under-18s");
  return {
    idType: dto.idType,
    idLast4: dto.idLast4?.toUpperCase(),
    dob: dto.dob ? dob : undefined,
    guardianName: dto.guardianName?.trim(),
    guardianMobile: dto.guardianMobile,
    biometricConsent: dto.biometricConsent,
    ...(dto.biometricConsent === false ? { faceEnrolled: false } : {}),
    consents: dto.consents ? mergeConsents(current?.consents, dto.consents) : undefined,
  };
}

/** Consent history only grows: new entries are added, existing ones are never rewritten. */
function mergeConsents(stored: Prisma.JsonValue | undefined, incoming: NonNullable<CustomerIdentityDto["consents"]>): Prisma.InputJsonValue {
  const history = Array.isArray(stored) ? (stored as Prisma.JsonObject[]) : [];
  const seen = new Set(history.map((entry) => `${entry.purpose}|${entry.at}`));
  const added = incoming.filter((entry) => !seen.has(`${entry.purpose}|${entry.at}`)).map((entry) => ({ ...entry }));
  return [...history, ...added] as Prisma.InputJsonValue;
}

function ageOn(dob: Date, today: Date): number {
  let age = today.getUTCFullYear() - dob.getUTCFullYear();
  const beforeBirthday =
    today.getUTCMonth() < dob.getUTCMonth() || (today.getUTCMonth() === dob.getUTCMonth() && today.getUTCDate() < dob.getUTCDate());
  if (beforeBirthday) age -= 1;
  return age;
}

function present(customer: Customer): CustomerDto {
  return {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    mobile: customer.mobile,
    idType: customer.idType,
    idLast4: customer.idLast4,
    dob: customer.dob ? customer.dob.toISOString().slice(0, 10) : null,
    guardianName: customer.guardianName,
    guardianMobile: customer.guardianMobile,
    biometricConsent: customer.biometricConsent,
    faceEnrolled: customer.faceEnrolled,
    consents: Array.isArray(customer.consents) ? (customer.consents as unknown as CustomerDto["consents"]) : [],
    visitorRef: customer.visitorRef,
    createdAt: customer.createdAt.toISOString(),
  };
}

function presentCorrection(row: { reference: string; field: string; detail: string; status: string; createdAt: Date }) {
  return {
    reference: row.reference,
    field: row.field,
    detail: row.detail,
    status: row.status,
    createdAt: row.createdAt,
    replyBy: new Date(row.createdAt.getTime() + 7 * 24 * 60 * 60 * 1000),
  };
}
