// app/actions/billing-job-actions.ts
"use server";

import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
    addDays,
    differenceInCalendarDays,
    endOfDay,
    format,
    isSameDay,
    startOfDay,
} from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { Prisma } from "@prisma/client";
import { buildBillingMessage } from "./billing-message-templates";
import { ResponseFormat, SOON_DAYS_BILLING } from "@/types/billing";
import { onlyDigitsPhone, pickTemplate } from "./helpers/billing-helpers";
import { assertAdminOrReseller } from "./helpers/billing-helpers.server";
import { SERVER_TIME_ZONE } from "@/types/schedule";

type BillingJobLogEntry = {
    at: string;
    level: "INFO" | "WARN" | "ERROR";
    message: string;
    userBillingId?: string;
    userId?: string;
    template?: string;
    idempotencyKey?: string;
};

type BillingCreatedItem = {
    userBillingId: string;
    userId: string;
    name: string;
    plan?: string | null;
    remoteJid: string;
    template: string;
    scheduleAt: string;
    dueDateYmd: string;
    daysRemaining: number;
    idempotencyKey: string;
    price?: Prisma.Decimal | null;
    currencyCode?: string | null;
};

type BillingSkippedItem = {
    userBillingId: string;
    userId: string;
    name: string;
    template?: string;
    reason: string;
    idempotencyKey?: string;
};

type BillingDebtorItem = {
    userBillingId: string;
    userId: string;
    name: string;
    plan?: string | null;
    dueDateYmd: string;
    daysRemaining: number;
    graceDays: number;
    accessStatus: string;
    billingStatus: string;
    lastReminderAt?: string | null;
};

type BillingFollowupsItem = {
    id: string;
    remoteJid: string;
    time: string;
    tipo: string;
    status?: string | null;
    sentAt?: string | null;
    error?: string | null;
    idempotencyKey?: string | null;
};

type BillingReport = {
    ranAt: string;
    timeZone: string;
    candidates: number;
    created: BillingCreatedItem[];
    skipped: BillingSkippedItem[];
    debtors: BillingDebtorItem[];
    followups: {
        createdToday: number;
        nextToSendAt?: string | null;
        items?: BillingFollowupsItem[];
    };
};

type BillingJobResult = ResponseFormat<{
    attempted: number;
    enqueued: number;
    sent: number;
    suspendedApplied: number;
    errors: number;
    logs: BillingJobLogEntry[];
    report: BillingReport;
}>;

function buildEmptyReport(now: Date): BillingReport {
    return {
        ranAt: now.toISOString(),
        timeZone: SERVER_TIME_ZONE,
        candidates: 0,
        created: [],
        skipped: [],
        debtors: [],
        followups: {
            createdToday: 0,
            nextToSendAt: null,
            items: [],
        },
    };
}

async function runBillingDailyJobInternal(requireAuth: boolean): Promise<BillingJobResult> {
    const now = new Date();
    const nowZ = toZonedTime(now, SERVER_TIME_ZONE);
    const emptyReport = buildEmptyReport(now);

    try {
        const BILLING_SEGUIMIENTO_TYPE = "billing-text";
        const logs: BillingJobLogEntry[] = [];
        const created: BillingCreatedItem[] = [];
        const skipped: BillingSkippedItem[] = [];
        const pushLog = (entry: BillingJobLogEntry) => logs.push(entry);

        if (requireAuth) {
            const me = await currentUser();
            if (!me) {
                pushLog({
                    at: new Date().toISOString(),
                    level: "ERROR",
                    message: "No autorizado para ejecutar job de billing.",
                });
                return {
                    success: false,
                    message: "No autorizado.",
                    data: {
                        attempted: 0,
                        enqueued: 0,
                        sent: 0,
                        suspendedApplied: 0,
                        errors: 1,
                        logs,
                        report: emptyReport,
                    },
                };
            }
            assertAdminOrReseller(me.role);
        }

        const candidates = await db.userBilling.findMany({
            where: {
                billingStatus: "UNPAID",
                accessStatus: "ACTIVE",
                dueDate: {
                    lte: endOfDay(addDays(now, SOON_DAYS_BILLING)),
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
        let enqueued = 0;
        let suspendedApplied = 0;
        let errors = 0;

        pushLog({
            at: new Date().toISOString(),
            level: "INFO",
            message: `Candidatos cargados: ${candidates.length}.`,
        });

        for (const b of candidates) {
            try {
                const candidateName = b.user?.name || b.user?.company || "Cliente";

                if (!b.dueDate) {
                    skipped.push({
                        userBillingId: b.id,
                        userId: b.userId,
                        name: candidateName,
                        reason: "NO_DUE_DATE",
                    });
                    pushLog({
                        at: new Date().toISOString(),
                        level: "WARN",
                        message: "Se omite registro sin dueDate.",
                        userBillingId: b.id,
                        userId: b.userId,
                    });
                    continue;
                }

                const due = new Date(b.dueDate);
                const daysRemaining = differenceInCalendarDays(due, now);
                const is3DaysBefore = daysRemaining === SOON_DAYS_BILLING;
                const isDueToday = daysRemaining === 0;
                const grace = Number(b.graceDays || 0);
                const isExpiredBeyondGrace = daysRemaining <= -grace && daysRemaining < 0 && grace > 0;

                const template = pickTemplate({
                    daysRemaining,
                    graceDays: grace,
                    is3DaysBefore,
                    isDueToday,
                    isExpiredBeyondGrace,
                });

                if (!template) {
                    skipped.push({
                        userBillingId: b.id,
                        userId: b.userId,
                        name: candidateName,
                        reason: "NO_TEMPLATE",
                    });
                    pushLog({
                        at: new Date().toISOString(),
                        level: "INFO",
                        message: "Sin plantilla aplicable para hoy.",
                        userBillingId: b.id,
                        userId: b.userId,
                    });
                    continue;
                }

                if (b.lastReminderDueDate) {
                    const last = new Date(b.lastReminderDueDate);
                    if (isSameDay(last, due)) {
                        skipped.push({
                            userBillingId: b.id,
                            userId: b.userId,
                            name: candidateName,
                            template,
                            reason: "ANTI_SPAM_SAME_DUEDATE",
                        });
                        pushLog({
                            at: new Date().toISOString(),
                            level: "INFO",
                            message: "Omitido por anti-spam de same dueDate.",
                            userBillingId: b.id,
                            userId: b.userId,
                            template,
                        });
                        continue;
                    }
                }

                const user = b.user;
                const urlevo = user.apiKey?.url?.trim();
                const instance = user.instancias?.[0];
                const target = (b.notifyRemoteJid?.trim() || user.notificationNumber || "").trim();
                const remoteJid = target.includes("@") ? target : onlyDigitsPhone(target);

                if (!urlevo || !instance?.instanceName || !instance?.instanceId || !remoteJid) {
                    skipped.push({
                        userBillingId: b.id,
                        userId: b.userId,
                        name: candidateName,
                        template,
                        reason: "MISSING_DATA",
                    });
                    pushLog({
                        at: new Date().toISOString(),
                        level: "WARN",
                        message: "Datos incompletos para crear seguimiento (url/instancia/remoteJid).",
                        userBillingId: b.id,
                        userId: b.userId,
                        template,
                    });
                    continue;
                }

                const paymentText =
                    (b.paymentNotes?.trim() || b.paymentMethodLabel?.trim() || "").trim() || "-";
                const planLabel = b.serviceName ? `Plan ${b.serviceName}` : "Plan Agente IA";
                const licenseLabel = "Licencia 30 dias";
                const currencyFlag = b.currencyCode === "USD" ? "US" : null;

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
                    clientName: candidateName,
                });

                attempted++;

                const scheduleAt = format(toZonedTime(new Date(), SERVER_TIME_ZONE), "dd/MM/yyyy HH:mm");
                const dueDateYmd = format(toZonedTime(due, SERVER_TIME_ZONE), "yyyy-MM-dd");
                const idempotencyKey = `billing:${b.id}:${dueDateYmd}:${template}`;

                const existingReminder = await db.seguimiento.findUnique({
                    where: { idempotencyKey },
                });
                if (existingReminder) {
                    skipped.push({
                        userBillingId: b.id,
                        userId: b.userId,
                        name: candidateName,
                        template,
                        reason: "IDEMPOTENT_EXISTS",
                        idempotencyKey,
                    });
                    pushLog({
                        at: new Date().toISOString(),
                        level: "INFO",
                        message: "Omitido por idempotencia: seguimiento ya existe.",
                        userBillingId: b.id,
                        userId: b.userId,
                        template,
                        idempotencyKey,
                    });
                    continue;
                }

                try {
                    await db.seguimiento.create({
                        data: {
                            idNodo: "",
                            serverurl: `https://${urlevo}`,
                            instancia: instance.instanceName,
                            apikey: instance.instanceId,
                            remoteJid,
                            mensaje: text,
                            tipo: BILLING_SEGUIMIENTO_TYPE,
                            idempotencyKey,
                            time: scheduleAt,
                        },
                    });
                } catch (error) {
                    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
                        skipped.push({
                            userBillingId: b.id,
                            userId: b.userId,
                            name: candidateName,
                            template,
                            reason: "IDEMPOTENT_RACE_P2002",
                            idempotencyKey,
                        });
                        pushLog({
                            at: new Date().toISOString(),
                            level: "INFO",
                            message: "Colision de idempotencia detectada (P2002), se omite duplicado.",
                            userBillingId: b.id,
                            userId: b.userId,
                            template,
                            idempotencyKey,
                        });
                        continue;
                    }
                    throw error;
                }

                enqueued++;
                created.push({
                    userBillingId: b.id,
                    userId: b.userId,
                    name: candidateName,
                    plan: user.plan ?? null,
                    remoteJid,
                    template,
                    scheduleAt,
                    dueDateYmd,
                    daysRemaining,
                    idempotencyKey,
                    price: b.price,
                    currencyCode: b.currencyCode ?? null,
                });
                pushLog({
                    at: new Date().toISOString(),
                    level: "INFO",
                    message: "Seguimiento de billing encolado.",
                    userBillingId: b.id,
                    userId: b.userId,
                    template,
                    idempotencyKey,
                });

                await db.userBilling.update({
                    where: { id: b.id },
                    data: {
                        lastReminderAt: new Date(),
                        lastReminderDueDate: due,
                    },
                });

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
                    pushLog({
                        at: new Date().toISOString(),
                        level: "WARN",
                        message: "Acceso suspendido por vencimiento sin pago.",
                        userBillingId: b.id,
                        userId: b.userId,
                        template,
                    });
                }
            } catch (e: any) {
                console.error("[runBillingDailyJob.loop]", e);
                errors++;
                skipped.push({
                    userBillingId: b.id,
                    userId: b.userId,
                    name: b.user?.name || b.user?.company || "Cliente",
                    reason: "INTERNAL_ERROR",
                });
                pushLog({
                    at: new Date().toISOString(),
                    level: "ERROR",
                    message: e?.message ?? "Error no controlado en iteracion del job.",
                    userBillingId: b.id,
                    userId: b.userId,
                });
            }
        }

        const debtorsRaw = await db.userBilling.findMany({
            where: { billingStatus: "UNPAID" },
            include: {
                user: { select: { id: true, name: true, company: true, plan: true } },
            },
            orderBy: { dueDate: "asc" },
            take: 300,
        });

        const debtors = debtorsRaw
            .filter((x) => !!x.dueDate)
            .map((x) => {
                const due = new Date(x.dueDate as Date);
                const daysRemaining = differenceInCalendarDays(due, now);
                return {
                    userBillingId: x.id,
                    userId: x.userId,
                    name: x.user?.name || x.user?.company || "Cliente",
                    plan: x.user?.plan ?? null,
                    dueDateYmd: format(toZonedTime(due, SERVER_TIME_ZONE), "yyyy-MM-dd"),
                    daysRemaining,
                    graceDays: Number(x.graceDays || 0),
                    accessStatus: x.accessStatus,
                    billingStatus: x.billingStatus,
                    lastReminderAt: x.lastReminderAt ? x.lastReminderAt.toISOString() : null,
                };
            })
            .filter((d) => d.daysRemaining < 0);

        const followupsRaw = await db.seguimiento.findMany({
            where: {
                tipo: BILLING_SEGUIMIENTO_TYPE,
                createdAt: {
                    gte: startOfDay(nowZ),
                    lte: endOfDay(nowZ),
                },
            },
            orderBy: { createdAt: "desc" },
            take: 200,
            select: {
                id: true,
                remoteJid: true,
                time: true,
                tipo: true,
                idempotencyKey: true,
            },
        });

        const followupItems: BillingFollowupsItem[] = followupsRaw.map((row) => ({
            id: String(row.id),
            remoteJid: row.remoteJid ?? "",
            time: row.time ?? "",
            tipo: row.tipo ?? BILLING_SEGUIMIENTO_TYPE,
            status: null,
            sentAt: null,
            error: null,
            idempotencyKey: row.idempotencyKey ?? null,
        }));

        pushLog({
            at: new Date().toISOString(),
            level: "INFO",
            message: `Resumen job billing: attempted=${attempted}, enqueued=${enqueued}, suspended=${suspendedApplied}, errors=${errors}.`,
        });

        const report: BillingReport = {
            ranAt: new Date().toISOString(),
            timeZone: SERVER_TIME_ZONE,
            candidates: candidates.length,
            created,
            skipped,
            debtors,
            followups: {
                createdToday: followupItems.length,
                nextToSendAt: format(toZonedTime(now, SERVER_TIME_ZONE), "dd/MM/yyyy HH:mm"),
                items: followupItems,
            },
        };

        return {
            success: true,
            message: "Job de billing ejecutado.",
            data: {
                attempted,
                enqueued,
                sent: enqueued,
                suspendedApplied,
                errors,
                logs,
                report,
            },
        };
    } catch (e: any) {
        console.error("[runBillingDailyJob]", e);
        return {
            success: false,
            message: e?.message ?? "Error ejecutando job.",
            data: {
                attempted: 0,
                enqueued: 0,
                sent: 0,
                suspendedApplied: 0,
                errors: 1,
                logs: [
                    {
                        at: new Date().toISOString(),
                        level: "ERROR",
                        message: e?.message ?? "Error ejecutando job.",
                    },
                ],
                report: emptyReport,
            },
        };
    }
}

export async function runBillingDailyJob(): Promise<BillingJobResult> {
    return runBillingDailyJobInternal(true);
}

export async function runBillingDailyJobSystem(): Promise<BillingJobResult> {
    return runBillingDailyJobInternal(false);
}
