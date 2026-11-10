// lib/db.ts
import { PrismaClient } from "@prisma/client";
const globalForPrisma = global;
export const prisma = globalForPrisma.prisma ??
    new PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });
// Prevent new PrismaClient on hot-reload in dev
if (process.env.NODE_ENV !== "production")
    globalForPrisma.prisma = prisma;
