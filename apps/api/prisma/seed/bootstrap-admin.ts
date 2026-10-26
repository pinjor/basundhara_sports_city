import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

/**
 * Creates the first super admin from BOOTSTRAP_ADMIN_EMAIL / BOOTSTRAP_ADMIN_PASSWORD when the database
 * has none, so production can start without demo data. Never changes an existing account.
 */
async function main() {
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD ?? "";
  const name = process.env.BOOTSTRAP_ADMIN_NAME?.trim() || "Administrator";
  if (!email) return;
  if (password.length < 12) throw new Error("BOOTSTRAP_ADMIN_PASSWORD must be at least 12 characters");

  const prisma = new PrismaClient();
  try {
    const existing = await prisma.user.count({ where: { role: "SUPER_ADMIN", active: true } });
    if (existing > 0) {
      console.log("Bootstrap admin skipped: an active super admin already exists");
      return;
    }
    await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, name, role: "SUPER_ADMIN", passwordHash: await bcrypt.hash(password, 10) },
    });
    console.log(`Bootstrap admin ready: ${email}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
