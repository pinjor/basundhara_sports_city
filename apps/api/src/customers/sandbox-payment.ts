import { HttpException, HttpStatus, ServiceUnavailableException } from "@nestjs/common";
import { randomBytes } from "crypto";

/** App payments run against the sandbox until a live gateway is connected (same switch as ticketing). */
export function assertSandboxPayments(): void {
  if (process.env.TICKETING_SANDBOX_PAYMENTS !== "true") {
    throw new ServiceUnavailableException("Live payment providers are not connected. Sandbox payments are switched off (OD-02).");
  }
}

export function sandboxRef(): string {
  return `SANDBOX-${randomBytes(4).toString("hex")}`;
}

/** 402: the payment was declined; nothing changed and the same request can be retried. */
export class PaymentDeclinedException extends HttpException {
  constructor() {
    super({ statusCode: HttpStatus.PAYMENT_REQUIRED, error: "Payment Declined", message: "Payment was declined. Try again or use another method." }, HttpStatus.PAYMENT_REQUIRED);
  }
}

export const DHAKA_OFFSET_MS = 6 * 3_600_000;

/** Today's date in Dhaka as midnight UTC, matching how booking dates are stored. */
export function dhakaToday(now = Date.now()): Date {
  const today = new Date(now + DHAKA_OFFSET_MS);
  today.setUTCHours(0, 0, 0, 0);
  return today;
}
