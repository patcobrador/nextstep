import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "./generated/prisma/client.js";

export { PrismaClient } from "./generated/prisma/client.js";
export * from "./generated/prisma/enums.js";
export type { Prisma } from "./generated/prisma/client.js";

export function createPrismaClient(
  connectionString = process.env["DATABASE_URL"] ??
    (process.env["NODE_ENV"] === "production"
      ? undefined
      : "postgresql://nextstep:nextstep@localhost:5433/nextstep"),
): PrismaClient {
  if (!connectionString) {
    throw new Error("DATABASE_URL is required to create the Prisma client.");
  }
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
}
