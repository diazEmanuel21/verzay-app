// app/actions/billing-job-actions.ts
"use server";

import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { addDays, endOfDay, differenceInCalendarDays, isSameDay } from "date-fns";
import { buildBillingMessage } from "./billing-message-templates";
import { sendingMessages } from "../sending-messages-actions";
import { ResponseFormat } from "@/types/billing";
import { onlyDigitsPhone, pickTemplate } from "./helpers/billing-helpers";
import { assertAdminOrReseller } from "./helpers/billing-helpers.server";

/**
 * Job:
 * - Envía recordatorio a 3 días antes
 * - Envía "Hoy vence" el mismo día
 * - Envía "Expirado" cuando ya pasó el graceDays (o si graceDays=3, justo a -3)
 * - Suspende servicio cuando sobrepasa graceDays (mantengo tu suspensión, pero ahora queda alineada)
 */
export async function runBillingDailyJob(): Promise<
    ResponseFormat<{
        attempted: number;
        sent: number;
        suspendedApplied: number;
        errors: number;
    }>
> {
    try {
        const me = await currentUser();
        if (!me) return { success: false, message: "No autorizado." };
        assertAdminOrReseller(me.role);

        const now = new Date();

        // Tomamos todos los UNPAID ACTIVE con dueDate <= +3 días (para cubrir 3d antes, hoy y vencidos recientes)
        // y también los vencidos para evaluar expired por graceDays.
        const candidates = await db.userBilling.findMany({
            where: {
                billingStatus: "UNPAID",
                accessStatus: "ACTIVE",
                dueDate: {
                    lte: endOfDay(addDays(now, 3)), // hasta +3 días
                },
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        company: true,
                        notificationNumber: true,
                        plan: true,
                        apiKey: { select: { url: true } },
                        instancias: { select: { instanceId: true, instanceName: true } },
                    },
                },
            },
        });

        let attempted = 0;
        let sent = 0;
        let suspendedApplied = 0;
        let errors = 0;

        for (const b of candidates) {
            try {
                if (!b.dueDate) continue;
                const due = new Date(b.dueDate);

                const daysRemaining = differenceInCalendarDays(due, now);

                // Ventanas:
                const is3DaysBefore = daysRemaining === 3;
                const isDueToday = daysRemaining === 0;

                // EXPIRED cuando ya pasó el graceDays (por ej graceDays=3 => daysRemaining <= -3)
                const grace = Number(b.graceDays || 0);
                const isExpiredBeyondGrace = daysRemaining <= -grace && daysRemaining < 0 && grace > 0;

                const template = pickTemplate({
                    daysRemaining,
                    graceDays: grace,
                    is3DaysBefore,
                    isDueToday,
                    isExpiredBeyondGrace,
                });

                // Si no toca enviar nada hoy, seguimos
                if (!template) continue;

                // anti-spam: no repetir para el mismo dueDate (mismo día)
                if (b.lastReminderDueDate) {
                    const last = new Date(b.lastReminderDueDate);
                    if (isSameDay(last, due) && template !== "EXPIRED") {
                        // Para EXPIRED podrías querer permitir otro aviso; por ahora lo enviamos solo una vez también:
                        continue;
                    }
                    if (isSameDay(last, due) && template === "EXPIRED") continue;
                }

                const user = b.user;
                const urlevo = user.apiKey?.url;
                const instance = user.instancias?.[0];
                const target = (b.notifyRemoteJid?.trim() || user.notificationNumber || "").trim();
                // si viene con @s.whatsapp.net lo respetamos; si no, lo normalizamos
                const remoteJid = target.includes("@")
                    ? target
                    : onlyDigitsPhone(target);

                if (!urlevo || !instance?.instanceName || !instance?.instanceId || !remoteJid) continue;

                const url = `https://${urlevo}/message/sendText/${instance.instanceName}`;
                const apikey = instance.instanceId;

                // Medios de pago: prioriza notes (link/instrucciones) y si no, label
                const paymentText = (b.paymentNotes?.trim() || b.paymentMethodLabel?.trim() || "").trim() || "—";

                // Plan / licencia: por ahora fijo como tus ejemplos (luego lo hacemos dinámico por plan)
                const planLabel = b.serviceName ? `🤖 ${b.serviceName}` : `🤖 Agente IA`;
                const licenseLabel = `🗓️ Licencia 30 días`;

                // Bandera opcional (si quieres, luego la hacemos por currencyCode)
                const currencyFlag = b.currencyCode === "USD" ? "🇺🇸" : null;

                const text = buildBillingMessage({
                    type: template,
                    dueDate: due,
                    daysRemaining,
                    planLabel,
                    licenseLabel,
                    price: b.price,
                    currencyCode: b.currencyCode || "COP",
                    currencyFlag,
                    paymentLinkOrText: paymentText,
                    clientName: user.name || user.company || "Cliente",
                });

                attempted++;

                const result = await sendingMessages({ url, apikey, remoteJid, text });

                if (result.success) {
                    sent++;

                    await db.userBilling.update({
                        where: { id: b.id },
                        data: {
                            lastReminderAt: new Date(),
                            lastReminderDueDate: due,
                        },
                    });

                    // Si hoy está expirado (beyond grace), también suspendemos (corte alineado al mensaje)
                    if (template === "EXPIRED") {
                        await db.userBilling.update({
                            where: { id: b.id },
                            data: {
                                accessStatus: "SUSPENDED",
                                suspendedAt: new Date(),
                                suspendedReason: "Vencido sin pago",
                            },
                        });
                        suspendedApplied++;
                    }
                } else {
                    errors++;
                }
            } catch (e) {
                console.error("[runBillingDailyJob.loop]", e);
                errors++;
            }
        }

        return {
            success: true,
            message: "Job de billing ejecutado.",
            data: { attempted, sent, suspendedApplied, errors },
        };
    } catch (e: any) {
        console.error("[runBillingDailyJob]", e);
        return { success: false, message: e?.message ?? "Error ejecutando job." };
    }
}