// app/actions/billing-page-actions.ts
"use server";

import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ResponseFormat } from "@/types/billing";
import { serializeUserBilling } from "./helpers/billing-helpers";

/**
 * devuelve users + billing (sin tocar getClientsPageData).
 *
 * Nota: aquí no filtro por reseller porque tu getClientsPageData ya lo hace,
 * pero como pediste "no modificar", lo hacemos independiente y simple.
 */

export async function getClientsWithBilling(): Promise<ResponseFormat<any[]>> {
  try {
    const me = await currentUser();
    if (!me) return { success: false, message: "No autorizado." };
    if (me.role !== "admin" && me.role !== "reseller") {
      return { success: false, message: "No autorizado." };
    }

    const users = await db.user.findMany({
      orderBy: { createdAt: "desc" },
      where: { status: true },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        company: true,
        notificationNumber: true,
        plan: true,
        createdAt: true,
        billing: true,
      },
    });

    // Serializa antes de enviar al Client Component
    const safeUsers = users.map((u) => ({
      ...u,
      createdAt: u.createdAt ? u.createdAt.toISOString() : null,
    })).map(serializeUserBilling);

    return { success: true, message: "Clientes cargados.", data: safeUsers };
  } catch (e: any) {
    console.error("[getClientsWithBilling]", e);
    return { success: false, message: e?.message ?? "Error cargando clientes con billing." };
  }
}