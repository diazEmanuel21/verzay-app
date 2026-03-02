import { Prisma } from "@prisma/client";
import { currentUser } from "@/lib/auth";
import { isAdminOrReseller } from "@/lib/rbac";

/**
 * Helpers SERVER (auth/guards/decimal)
 */
export async function requireAuth() {
  const user = await currentUser();
  if (!user) throw new Error("No autorizado.");
  return user;
}

export function assertAdminOrReseller(role?: string | null) {
  if (!isAdminOrReseller(role)) {
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
