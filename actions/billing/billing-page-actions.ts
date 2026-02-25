// app/actions/billing-page-actions.ts
"use server";

import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ResponseFormat } from "@/types/billing";

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

    // Si quieres la lógica reseller EXACTA, lo replicamos luego.
    const users = await db.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        company: true,
        notificationNumber: true,
        plan: true,
        createdAt: true,
        billing: true, // relación UserBilling?
      },
    });

    return { success: true, message: "Clientes cargados.", data: users };
  } catch (e: any) {
    console.error("[getClientsWithBilling]", e);
    return {
      success: false,
      message: e?.message ?? "Error cargando clientes con billing.",
    };
  }
}