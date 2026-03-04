// app/actions/billing-actions.ts
"use server";

import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { serializeUserBilling, toDate } from "./helpers/billing-helpers";
import { currentUser } from "@/lib/auth";
import { BillingUpsertInput, ResponseFormat } from "@/types/billing";
import {
    assertBillingScope,
    normalizeCurrencyCode,
    normalizeGraceDays,
    normalizeOptionalText,
    toDecimal,
} from "./helpers/billing-helpers.server";

const isProvided = (v: unknown) => v !== null && v !== undefined && String(v).trim() !== "";

/**
 * 1) Obtener billing de un cliente
 */
export async function getUserBillingByUserId(
    userId: string
): Promise<ResponseFormat<any>> {
    try {
        const me = await currentUser();
        const scopedUserId = await assertBillingScope(me ?? {}, userId);

        const billing = await db.userBilling.findUnique({
            where: { userId: scopedUserId },
        });

        return {
            success: true,
            message: billing ? "Billing encontrado." : "Cliente sin billing configurado.",
            data: serializeUserBilling(billing),
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
 * 2) Upsert de configuracion billing (precio/medio/notas/moneda/graceDays)
 */
export async function upsertUserBillingConfig(
    input: BillingUpsertInput
): Promise<ResponseFormat<any>> {
    try {
        const me = await currentUser();
        const scopedUserId = await assertBillingScope(me ?? {}, input?.userId);

        const price = toDecimal(input.price);
        if (isProvided(input.price) && !price) {
            return { success: false, message: "price invalido." };
        }
        if (price && price.lt(0)) {
            return { success: false, message: "price no puede ser negativo." };
        }

        const serviceStartAt = toDate(input.serviceStartAt);
        const serviceEndsAt = toDate(input.serviceEndsAt);

        if (isProvided(input.serviceStartAt) && !serviceStartAt) {
            return { success: false, message: "serviceStartAt invalida." };
        }
        if (isProvided(input.serviceEndsAt) && !serviceEndsAt) {
            return { success: false, message: "serviceEndsAt invalida." };
        }
        if (serviceStartAt && serviceEndsAt && serviceEndsAt < serviceStartAt) {
            return { success: false, message: "serviceEndsAt no puede ser menor a serviceStartAt." };
        }

        const graceDays = normalizeGraceDays(input.graceDays);
        const currencyCode = isProvided(input.currencyCode)
            ? normalizeCurrencyCode(input.currencyCode)
            : undefined;

        const data: Prisma.UserBillingUncheckedUpdateInput = {
            price,
            currencyCode,
            paymentMethodLabel: normalizeOptionalText(input.paymentMethodLabel, 120),
            paymentNotes: normalizeOptionalText(input.paymentNotes, 1000),
            graceDays,
            serviceName: normalizeOptionalText(input.serviceName, 120),
            notifyRemoteJid: normalizeOptionalText(input.notifyRemoteJid, 80),
            serviceStartAt: serviceStartAt ?? undefined,
            serviceEndsAt: serviceEndsAt ?? undefined,
        };

        const billing = await db.userBilling.upsert({
            where: { userId: scopedUserId },
            create: {
                userId: scopedUserId,
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
 *    - Si llega dueDate valida, intenta regularizar: PAID + ACTIVE
 *    - Si falla regularizacion, conserva dueDate y aplica fallback de activacion cuando corresponde
 *    - Resetea lastReminderDueDate si cambias de ciclo
 */
export async function setUserBillingDueDate(
    userId: string,
    dueDate: string | Date | null
): Promise<ResponseFormat<any>> {
    try {
        const me = await currentUser();
        const scopedUserId = await assertBillingScope(me ?? {}, userId);

        const parsed = toDate(dueDate);
        if (dueDate && !parsed) {
            return { success: false, message: "dueDate invalida." };
        }

        const billing = await db.userBilling.upsert({
            where: { userId: scopedUserId },
            create: {
                userId: scopedUserId,
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

        if (!parsed) {
            return { success: true, message: "Fecha de pago actualizada.", data: billing };
        }

        const needsAutoRegularization =
            billing.billingStatus !== "PAID" || billing.accessStatus === "SUSPENDED";

        if (!needsAutoRegularization) {
            return { success: true, message: "Fecha de pago actualizada.", data: billing };
        }

        const now = new Date();

        try {
            const regularized = await db.userBilling.update({
                where: { userId: scopedUserId },
                data: {
                    billingStatus: "PAID",
                    accessStatus: "ACTIVE",
                    lastPaymentAt: now,
                    suspendedAt: null,
                    suspendedReason: null,
                    serviceStartAt: billing.serviceStartAt ?? now,
                    serviceEndAt: null,
                },
            });

            return {
                success: true,
                message: "Fecha de pago actualizada. Cliente marcado como pagado y servicio activo.",
                data: regularized,
            };
        } catch (regularizeError: any) {
            console.error("[setUserBillingDueDate:auto-regularize]", regularizeError);

            if (billing.accessStatus === "SUSPENDED") {
                try {
                    const activated = await db.userBilling.update({
                        where: { userId: scopedUserId },
                        data: {
                            accessStatus: "ACTIVE",
                            suspendedAt: null,
                            suspendedReason: null,
                            serviceStartAt: billing.serviceStartAt ?? now,
                            serviceEndAt: null,
                        },
                    });

                    return {
                        success: true,
                        message:
                            "Fecha actualizada y servicio activado, pero no se pudo marcar como pagado automaticamente.",
                        data: activated,
                    };
                } catch (activateError) {
                    console.error("[setUserBillingDueDate:fallback-activate]", activateError);
                }
            }

            return {
                success: true,
                message: "Fecha actualizada, pero no se pudo regularizar el estado de pago automaticamente.",
                data: billing,
            };
        }
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
        const scopedUserId = await assertBillingScope(me ?? {}, userId);

        const now = new Date();
        const existing = await db.userBilling.findUnique({ where: { userId: scopedUserId } });

        const billing = await db.userBilling.upsert({
            where: { userId: scopedUserId },
            create: {
                userId: scopedUserId,
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
 * 5) Marcar como no pagado (no suspende automaticamente)
 */
export async function markUserAsUnpaid(
    userId: string
): Promise<ResponseFormat<any>> {
    try {
        const me = await currentUser();
        const scopedUserId = await assertBillingScope(me ?? {}, userId);

        const billing = await db.userBilling.upsert({
            where: { userId: scopedUserId },
            create: {
                userId: scopedUserId,
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
        const scopedUserId = await assertBillingScope(me ?? {}, userId);
        const normalizedReason = normalizeOptionalText(reason, 180);

        const now = new Date();

        const billing = await db.userBilling.upsert({
            where: { userId: scopedUserId },
            create: {
                userId: scopedUserId,
                currencyCode: "COP",
                billingStatus: "UNPAID",
                accessStatus: "SUSPENDED",
                suspendedAt: now,
                suspendedReason: normalizedReason ?? "Suspendido manualmente",
                graceDays: 0,
                serviceEndAt: now,
            },
            update: {
                accessStatus: "SUSPENDED",
                suspendedAt: now,
                suspendedReason: normalizedReason ?? "Suspendido manualmente",
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
        const scopedUserId = await assertBillingScope(me ?? {}, userId);

        const now = new Date();
        const existing = await db.userBilling.findUnique({ where: { userId: scopedUserId } });

        const billing = await db.userBilling.upsert({
            where: { userId: scopedUserId },
            create: {
                userId: scopedUserId,
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
