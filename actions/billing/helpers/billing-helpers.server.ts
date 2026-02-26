import { Prisma } from "@prisma/client";
import { currentUser } from "@/lib/auth";

/**
 * Helpers SERVER (auth/guards/decimal)
 */
export async function requireAuth() {
  const user = await currentUser();
  if (!user) throw new Error("No autorizado.");
  return user;
}

export function assertAdminOrReseller(role?: string | null) {
  if (role !== "admin" && role !== "reseller") {
    throw new Error("No autorizado.");
  }
}

export function toDecimal(value?: string | number | null): Prisma.Decimal | null {
  if (value === null || value === undefined || value === "") return null;
  try {
    return new Prisma.Decimal(value);
  } catch {
    return null;
  }
}