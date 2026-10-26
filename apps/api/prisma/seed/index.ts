import { PrismaClient } from "@prisma/client";
import { withSeeder } from "./app";
import { seedCore } from "./core";
import { seedFinance } from "./finance";
import { seedHrm } from "./hrm";
import { seedPlatform } from "./platform";
import { seedSupply } from "./supply";
import { seedVenue } from "./venue";

/**
 * Idempotent: runs on every container start. Each domain seed only fills empty tables,
 * so data entered through the app is never overwritten.
 */
async function main() {
  const prisma = new PrismaClient();
  try {
    await seedCore(prisma);
    await withSeeder(prisma, async (seeder) => {
      await seedFinance(seeder);
      await seedSupply(seeder);
      await seedHrm(seeder);
      await seedVenue(seeder);
      await seedPlatform(seeder);
    });
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
