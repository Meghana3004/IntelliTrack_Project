import path from "node:path";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// SQLite's relative datasource URL resolves relative to prisma/schema.prisma
// for the Prisma CLI, but relative to process.cwd() at runtime — an explicit
// absolute path here avoids that mismatch regardless of how the app is started.
const dbPath = path.join(process.cwd(), "prisma", "local.db");

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ datasourceUrl: `file:${dbPath}` });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
