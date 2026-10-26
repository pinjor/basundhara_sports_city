import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import type { Customer } from "@prisma/client";
import type { CustomerAuthResponseDto, CustomerDto, TokenPairDto } from "@bsc/shared";
import { PrismaService } from "../prisma/prisma.service";
import { TokenService, type Subject } from "../auth/token.service";
import type { ChangePasswordDto, RegisterCustomerDto, UpdateCustomerDto } from "./dto/customer.dto";

/** Compared against when the account is unknown, so response time does not reveal which emails exist. */
const DUMMY_HASH = bcrypt.hashSync("no-such-account", 10);

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
      data: { name: dto.name.trim(), email, mobile: dto.mobile, passwordHash: await bcrypt.hash(dto.password, 10) },
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
    const customer = await this.prisma.customer.update({
      where: { id },
      data: { name: dto.name?.trim(), email, mobile: dto.mobile },
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

  /**
   * Gym and pool membership on file with the same email and mobile. Both must match because
   * sign-up does not yet verify either one.
   */
  async membership(id: string) {
    const customer = await this.prisma.customer.findUniqueOrThrow({ where: { id } });
    const member = await this.prisma.member.findUnique({ where: { email: customer.email } });
    if (!member || normaliseMobile(member.phone) !== customer.mobile) return { member: null };
    return {
      member: {
        id: member.id,
        tier: member.tier,
        status: member.status,
        joinDate: member.joinDate,
        expiryDate: member.expiryDate,
        billingCycle: member.billingCycle,
        checkInCount: member.checkInCount,
        lastCheckIn: member.lastCheckIn,
      },
    };
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

/** "+880 1712-345678" and "01712345678" are the same number. */
function normaliseMobile(phone: string | null): string | null {
  const digits = phone?.replace(/\D/g, "") ?? "";
  if (!digits) return null;
  return digits.startsWith("880") ? `0${digits.slice(3)}` : digits;
}

function present(customer: Customer): CustomerDto {
  return { id: customer.id, name: customer.name, email: customer.email, mobile: customer.mobile, createdAt: customer.createdAt.toISOString() };
}
