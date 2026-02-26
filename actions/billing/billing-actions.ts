// app/actions/billing-actions.ts
"use server";

import { db } from "@/lib/db"; // ajusta si tu prisma client se llama distinto
import { Prisma } from "@prisma/client";
import { toDate } from "./helpers/billing-helpers";
import { currentUser } from "@/lib/auth";
import { BillingUpsertInput, ResponseFormat } from "@/types/billing";
import { assertAdminOrReseller, toDecimal } from "./helpers/billing-helpers.server";

/**
 * 1) Obtener billing de un cliente
 */
export async function getUserBillingByUserId(
    userId: string
): Promise<ResponseFormat<any>> {
    try {
        const me = await currentUser();
        assertAdminOrReseller(me.role);

        const billing = await db.userBilling.findUnique({
            where: { userId },
        });

        return {
            success: true,
            message: billing ? "Billing encontrado." : "Cliente sin billing configurado.",
            data: billing ?? null,
        };
    } catch (e: any) {
        console.error("[getUserBillingByUserId]", e);
        return {
            success: false,
            message: e?.message ?? "Error obteniendo billing.",
        };
    }
}

/**
 * 2) Upsert de configuración billing (precio/medio/notas/moneda/graceDays)
 *    - No toca estado (PAID/UNPAID) si no lo envías
 */
export async function upsertUserBillingConfig(
    input: BillingUpsertInput
): Promise<ResponseFormat<any>> {
    try {
        const me = await currentUser();
        assertAdminOrReseller(me.role);

        if (!input?.userId) {
            return { success: false, message: "userId es requerido." };
        }

        const data: Prisma.UserBillingUncheckedUpdateInput = {
            price: toDecimal(input.price),
            currencyCode: input.currencyCode ?? undefined,
            paymentMethodLabel: input.paymentMethodLabel ?? undefined,
            paymentNotes: input.paymentNotes ?? undefined,
            graceDays: typeof input.graceDays === "number" ? input.graceDays : undefined,
            serviceName: input.serviceName ?? undefined,
            notifyRemoteJid: input.notifyRemoteJid ?? undefined,
            serviceStartAt: toDate(input.serviceStartAt) ?? undefined,
            serviceEndsAt: toDate(input.serviceEndsAt) ?? undefined,
        };

        const billing = await db.userBilling.upsert({
            where: { userId: input.userId },
            create: {
                userId: input.userId,
                price: data.price as any,
                currencyCode: (data.currencyCode as any) ?? "COP",
                paymentMethodLabel: (data.paymentMethodLabel as any) ?? null,
                paymentNotes: (data.paymentNotes as any) ?? null,
                graceDays: (data.graceDays as any) ?? 0,
                serviceName: (data.serviceName as any) ?? null,
                notifyRemoteJid: (data.notifyRemoteJid as any) ?? null,
                serviceStartAt: (data.serviceStartAt as any) ?? null,
                serviceEndsAt: (data.serviceEndsAt as any) ?? null,
            },
            update: data,
        });

        return { success: true, message: "Billing actualizado.", data: billing };
    } catch (e: any) {
        console.error("[upsertUserBillingConfig]", e);
        return { success: false, message: e?.message ?? "Error actualizando billing." };
    }
}

/**
 * 3) Setear fecha de vencimiento (dueDate)
 *    - NO marca pagado automáticamente
 *    - Resetea lastReminderDueDate si cambias de ciclo
 */
export async function setUserBillingDueDate(
    userId: string,
    dueDate: string | Date | null
): Promise<ResponseFormat<any>> {
    try {
        const me = await currentUser();
        assertAdminOrReseller(me.role);

        if (!userId) return { success: false, message: "userId es requerido." };

        const parsed = toDate(dueDate);
        if (dueDate && !parsed) {
            return { success: false, message: "dueDate inválida." };
        }

        const billing = await db.userBilling.upsert({
            where: { userId },
            create: {
                userId,
                dueDate: parsed,
                serviceEndsAt: parsed,
                currencyCode: "COP",
                billingStatus: "UNPAID",
                accessStatus: "ACTIVE",
                graceDays: 0,
            },
            update: {
                dueDate: parsed,
                serviceEndsAt: parsed,
                lastReminderDueDate: null,
            },
        });

        return { success: true, message: "Fecha de pago actualizada.", data: billing };
    } catch (e: any) {
        console.error("[setUserBillingDueDate]", e);
        return { success: false, message: e?.message ?? "Error actualizando dueDate." };
    }
}

/**
 * 4) Marcar como pagado (reactiva servicio)
 */
export async function markUserAsPaid(
    userId: string
): Promise<ResponseFormat<any>> {
    try {
        const me = await currentUser();
        assertAdminOrReseller(me.role);

        if (!userId) return { success: false, message: "userId es requerido." };

        const now = new Date();
        // Traemos el billing actual para respetar "primera activación"
        const existing = await db.userBilling.findUnique({ where: { userId } });

        const billing = await db.userBilling.upsert({
            where: { userId },
            create: {
                userId,
                currencyCode: "COP",
                billingStatus: "PAID",
                accessStatus: "ACTIVE",
                lastPaymentAt: now,
                graceDays: 0,
                serviceStartAt: now,
                serviceEndAt: null,
            },
            update: {
                billingStatus: "PAID",
                accessStatus: "ACTIVE",
                lastPaymentAt: now,
                suspendedAt: null,
                suspendedReason: null,
                serviceStartAt: existing?.serviceStartAt ?? now,
                serviceEndAt: null,
            },
        });

        return { success: true, message: "Pago registrado. Servicio activo.", data: billing };
    } catch (e: any) {
        console.error("[markUserAsPaid]", e);
        return { success: false, message: e?.message ?? "Error marcando pago." };
    }
}

/**
 * 5) Marcar como no pagado (no suspende automáticamente)
 */
export async function markUserAsUnpaid(
    userId: string
): Promise<ResponseFormat<any>> {
    try {
        const me = await currentUser();
        assertAdminOrReseller(me.role);

        if (!userId) return { success: false, message: "userId es requerido." };

        const billing = await db.userBilling.upsert({
            where: { userId },
            create: {
                userId,
                currencyCode: "COP",
                billingStatus: "UNPAID",
                accessStatus: "ACTIVE",
                graceDays: 0,
            },
            update: {
                billingStatus: "UNPAID",
            },
        });

        return { success: true, message: "Estado actualizado: NO PAGADO.", data: billing };
    } catch (e: any) {
        console.error("[markUserAsUnpaid]", e);
        return { success: false, message: e?.message ?? "Error marcando no pagado." };
    }
}

/**
 * 6) Suspender manualmente (corte)
 */
export async function suspendUserService(
    userId: string,
    reason?: string | null
): Promise<ResponseFormat<any>> {
    try {
        const me = await currentUser();
        assertAdminOrReseller(me.role);

        if (!userId) return { success: false, message: "userId es requerido." };

        const now = new Date();

        const billing = await db.userBilling.upsert({
            where: { userId },
            create: {
                userId,
                currencyCode: "COP",
                billingStatus: "UNPAID",
                accessStatus: "SUSPENDED",
                suspendedAt: now,
                suspendedReason: reason ?? "Suspendido manualmente",
                graceDays: 0,
                serviceEndAt: now,
            },
            update: {
                accessStatus: "SUSPENDED",
                suspendedAt: now,
                suspendedReason: reason ?? "Suspendido manualmente",
                serviceEndAt: now,
            },
        });

        return { success: true, message: "Servicio suspendido.", data: billing };
    } catch (e: any) {
        console.error("[suspendUserService]", e);
        return { success: false, message: e?.message ?? "Error suspendiendo servicio." };
    }
}

/**
 * 7) Reactivar manualmente (sin marcar pagado)
 */
export async function activateUserService(
    userId: string
): Promise<ResponseFormat<any>> {
    try {
        const me = await currentUser();
        assertAdminOrReseller(me.role);

        if (!userId) return { success: false, message: "userId es requerido." };

        const now = new Date();
        const existing = await db.userBilling.findUnique({ where: { userId } });

        const billing = await db.userBilling.upsert({
            where: { userId },
            create: {
                userId,
                currencyCode: "COP",
                billingStatus: "UNPAID",
                accessStatus: "ACTIVE",
                graceDays: 0,
                serviceStartAt: now,
                serviceEndAt: null,
            },
            update: {
                accessStatus: "ACTIVE",
                suspendedAt: null,
                suspendedReason: null,
                serviceStartAt: existing?.serviceStartAt ?? now,
                serviceEndAt: null,
            },
        });

        return { success: true, message: "Servicio activado.", data: billing };
    } catch (e: any) {
        console.error("[activateUserService]", e);
        return { success: false, message: e?.message ?? "Error activando servicio." };
    }
}