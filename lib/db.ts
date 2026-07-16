import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const globalForDb = globalThis as unknown as { db?: PrismaClient };
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required.");
}

const adapter = new PrismaPg({ connectionString });

export const db = globalForDb.db ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForDb.db = db;
}
