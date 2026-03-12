"use server";

import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { ActionResult } from "@/types/registro";
import {
    CrmFollowUpStatus,
    FollowUpStatus,
    LeadStatus,
    SessionCrmFollowUpHistoryItem,
    SessionCrmFollowUpSummary,
    SessionFollowUpHistoryItem,
    SessionFollowUpSummary,
    TipoRegistro,
} from "@/types/session";
import { normalizeDetalleDraft } from "@/app/(root)/crm/dashboard/helpers/detalleEdit";

export type RegistrosFilters = {
    estado?: string;
    leadStatus?: LeadStatus | "none";
    crmFollowUpStatus?: CrmFollowUpStatus | "none";
    fechaDesde?: string;
    fechaHasta?: string;
    followUpStatus?: FollowUpStatus | "none";
    query?: string;
    leadOnly?: boolean;
};

type SessionLookup = {
    remoteJid: string;
    instanceId: string;
};

function buildSessionFollowUpKey(remoteJid?: string | null, instanceId?: string | null) {
    const remote = (remoteJid ?? "").trim();
    const instance = (instanceId ?? "").trim();
    if (!remote || !instance) return "";
    return `${instance}::${remote}`;
}

function createEmptyFollowUpSummary(): SessionFollowUpSummary {
    return {
        total: 0,
        active: 0,
        pending: 0,
        processing: 0,
        sent: 0,
        failed: 0,
        cancelled: 0,
        latestStatus: null,
        latestGeneratedMessage: null,
        latestCreatedAt: null,
        recentItems: [],
    };
}

function createEmptyCrmFollowUpSummary(): SessionCrmFollowUpSummary {
    return {
        total: 0,
        active: 0,
        pending: 0,
        processing: 0,
        sent: 0,
        failed: 0,
        cancelled: 0,
        skipped: 0,
        latestStatus: null,
        latestGeneratedMessage: null,
        latestScheduledFor: null,
        recentItems: [],
    };
}

async function getFollowUpSummaryMapBySessions(sessions: SessionLookup[]) {
    const uniqueSessionsMap = new Map<string, SessionLookup>();
    for (const session of sessions) {
        const key = buildSessionFollowUpKey(session.remoteJid, session.instanceId);
        if (!key) continue;
        uniqueSessionsMap.set(key, session);
    }
    const uniqueSessions = Array.from(uniqueSessionsMap.values());

    if (!uniqueSessions.length) return new Map<string, SessionFollowUpSummary>();

    const followUps = await db.seguimiento.findMany({
        where: {
            OR: uniqueSessions.map((session) => ({
                remoteJid: session.remoteJid,
                instancia: session.instanceId,
            })),
        },
        select: {
            id: true,
            remoteJid: true,
            instancia: true,
            followUpStatus: true,
            followUpMode: true,
            followUpAttempt: true,
            generatedMessage: true,
            mensaje: true,
            errorReason: true,
            createdAt: true,
            updatedAt: true,
        },
        orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    });

    const summaryMap = new Map<string, SessionFollowUpSummary>();

    for (const followUp of followUps) {
        const key = buildSessionFollowUpKey(followUp.remoteJid, followUp.instancia);
        if (!key) continue;

        const summary = summaryMap.get(key) ?? createEmptyFollowUpSummary();
        summary.total += 1;

        const status = (followUp.followUpStatus ?? "pending") as FollowUpStatus;
        switch (status) {
            case "pending":
                summary.pending += 1;
                summary.active += 1;
                break;
            case "processing":
                summary.processing += 1;
                summary.active += 1;
                break;
            case "sent":
                summary.sent += 1;
                break;
            case "failed":
                summary.failed += 1;
                break;
            case "cancelled":
                summary.cancelled += 1;
                break;
        }

        if (!summary.latestStatus) {
            summary.latestStatus = status;
            summary.latestGeneratedMessage = followUp.generatedMessage ?? followUp.mensaje ?? null;
            summary.latestCreatedAt = followUp.createdAt?.toISOString?.() ?? null;
        }

        if (summary.recentItems.length < 5) {
            const item: SessionFollowUpHistoryItem = {
                id: followUp.id,
                status,
                mode: followUp.followUpMode === "ai" ? "ai" : "static",
                attempt: Math.max(followUp.followUpAttempt ?? 0, 0),
                message: followUp.generatedMessage ?? followUp.mensaje ?? null,
                errorReason: followUp.errorReason ?? null,
                createdAt: followUp.createdAt?.toISOString?.() ?? null,
                updatedAt: followUp.updatedAt?.toISOString?.() ?? null,
            };
            summary.recentItems.push(item);
        }

        summaryMap.set(key, summary);
    }

    return summaryMap;
}

async function getCrmFollowUpSummaryMapBySessions(sessions: SessionLookup[]) {
    const uniqueSessionsMap = new Map<string, SessionLookup>();
    for (const session of sessions) {
        const key = buildSessionFollowUpKey(session.remoteJid, session.instanceId);
        if (!key) continue;
        uniqueSessionsMap.set(key, session);
    }
    const uniqueSessions = Array.from(uniqueSessionsMap.values());

    if (!uniqueSessions.length) return new Map<string, SessionCrmFollowUpSummary>();

    const crmFollowUps = await db.crmFollowUp.findMany({
        where: {
            OR: uniqueSessions.map((session) => ({
                remoteJid: session.remoteJid,
                instanceId: session.instanceId,
            })),
        },
        select: {
            id: true,
            remoteJid: true,
            instanceId: true,
            status: true,
            leadStatusSnapshot: true,
            attemptCount: true,
            generatedMessage: true,
            errorReason: true,
            scheduledFor: true,
            createdAt: true,
            updatedAt: true,
        },
        orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    });

    const summaryMap = new Map<string, SessionCrmFollowUpSummary>();

    for (const followUp of crmFollowUps) {
        const key = buildSessionFollowUpKey(followUp.remoteJid, followUp.instanceId);
        if (!key) continue;

        const summary = summaryMap.get(key) ?? createEmptyCrmFollowUpSummary();
        summary.total += 1;

        const status = followUp.status as CrmFollowUpStatus;
        switch (status) {
            case "PENDING":
                summary.pending += 1;
                summary.active += 1;
                break;
            case "PROCESSING":
                summary.processing += 1;
                summary.active += 1;
                break;
            case "SENT":
                summary.sent += 1;
                break;
            case "FAILED":
                summary.failed += 1;
                break;
            case "CANCELLED":
                summary.cancelled += 1;
                break;
            case "SKIPPED":
                summary.skipped += 1;
                break;
        }

        if (!summary.latestStatus) {
            summary.latestStatus = status;
            summary.latestGeneratedMessage = followUp.generatedMessage ?? null;
            summary.latestScheduledFor = followUp.scheduledFor?.toISOString?.() ?? null;
        }

        if (summary.recentItems.length < 5) {
            const item: SessionCrmFollowUpHistoryItem = {
                id: followUp.id,
                status,
                leadStatusSnapshot: followUp.leadStatusSnapshot,
                attemptCount: Math.max(followUp.attemptCount ?? 0, 0),
                message: followUp.generatedMessage ?? null,
                errorReason: followUp.errorReason ?? null,
                scheduledFor: followUp.scheduledFor?.toISOString?.() ?? null,
                createdAt: followUp.createdAt?.toISOString?.() ?? null,
                updatedAt: followUp.updatedAt?.toISOString?.() ?? null,
            };
            summary.recentItems.push(item);
        }

        summaryMap.set(key, summary);
    }

    return summaryMap;
}

async function getSessionIdsByFollowUpFilter(
    userId: string,
    followUpStatus?: FollowUpStatus | "none"
) {
    if (!followUpStatus) return null;

    const sessions = await db.session.findMany({
        where: { userId },
        select: {
            id: true,
            remoteJid: true,
            instanceId: true,
        },
    });

    if (!sessions.length) return [];

    const pairMap = new Map<string, { remoteJid: string; instanceId: string }>();
    for (const session of sessions) {
        const key = buildSessionFollowUpKey(session.remoteJid, session.instanceId);
        if (!key) continue;
        pairMap.set(key, {
            remoteJid: session.remoteJid,
            instanceId: session.instanceId,
        });
    }

    const pairs = Array.from(pairMap.values());
    if (!pairs.length) return [];

    const seguimientoWhere = {
        OR: pairs.map((pair) => ({
            remoteJid: pair.remoteJid,
            instancia: pair.instanceId,
        })),
        ...(followUpStatus === "none" ? {} : { followUpStatus }),
    };

    const followUps = await db.seguimiento.findMany({
        where: seguimientoWhere,
        select: {
            remoteJid: true,
            instancia: true,
        },
    });

    const followUpKeys = new Set(
        followUps.map((followUp) =>
            buildSessionFollowUpKey(followUp.remoteJid, followUp.instancia)
        )
    );

    return sessions
        .filter((session) => {
            const key = buildSessionFollowUpKey(session.remoteJid, session.instanceId);
            if (!key) return false;
            return followUpStatus === "none"
                ? !followUpKeys.has(key)
                : followUpKeys.has(key);
        })
        .map((session) => session.id);
}

async function getSessionIdsByCrmFollowUpFilter(
    userId: string,
    crmFollowUpStatus?: CrmFollowUpStatus | "none"
) {
    if (!crmFollowUpStatus) return null;

    const sessions = await db.session.findMany({
        where: { userId },
        select: {
            id: true,
            remoteJid: true,
            instanceId: true,
        },
    });

    if (!sessions.length) return [];

    const pairMap = new Map<string, { remoteJid: string; instanceId: string }>();
    for (const session of sessions) {
        const key = buildSessionFollowUpKey(session.remoteJid, session.instanceId);
        if (!key) continue;
        pairMap.set(key, {
            remoteJid: session.remoteJid,
            instanceId: session.instanceId,
        });
    }

    const pairs = Array.from(pairMap.values());
    if (!pairs.length) return [];

    const crmFollowUpWhere = {
        OR: pairs.map((pair) => ({
            remoteJid: pair.remoteJid,
            instanceId: pair.instanceId,
        })),
        ...(crmFollowUpStatus === "none" ? {} : { status: crmFollowUpStatus }),
    };

    const crmFollowUps = await db.crmFollowUp.findMany({
        where: crmFollowUpWhere,
        select: {
            remoteJid: true,
            instanceId: true,
        },
    });

    const crmFollowUpKeys = new Set(
        crmFollowUps.map((followUp) =>
            buildSessionFollowUpKey(followUp.remoteJid, followUp.instanceId)
        )
    );

    return sessions
        .filter((session) => {
            const key = buildSessionFollowUpKey(session.remoteJid, session.instanceId);
            if (!key) return false;
            return crmFollowUpStatus === "none"
                ? !crmFollowUpKeys.has(key)
                : crmFollowUpKeys.has(key);
        })
        .map((session) => session.id);
}

export async function createRegistro(input: {
    sessionId: number;
    tipo: TipoRegistro;
    fecha?: string; // ISO o datetime-local
    estado: string;

    // Campos para REPORTE
    nombre?: string;
    resumen?: string;
    lead?: boolean;

    // Campos para otros tipos
    detalles?: string;
}): Promise<ActionResult<unknown>> {
    try {
        const created = await db.registro.create({
            data: {
                sessionId: input.sessionId,
                tipo: input.tipo,
                fecha: input.fecha ? new Date(input.fecha) : new Date(),
                estado: input.estado,

                nombre: input.nombre ?? null,
                resumen: input.resumen ?? null,
                lead: input.lead ?? false,

                detalles: input.detalles ?? null,
            },
        });

        return { success: true, data: created };
    } catch (e: any) {
        return { success: false, message: e?.message ?? "No se pudo crear el registro" };
    }
}

export async function updateRegistro(input: {
    id: number;
    tipo: TipoRegistro;
    fecha?: string;
    estado: string;

    nombre?: string;
    resumen?: string;
    lead?: boolean;

    detalles?: string;
}): Promise<ActionResult<unknown>> {
    try {
        const updated = await db.registro.update({
            where: { id: input.id },
            data: {
                tipo: input.tipo,
                fecha: input.fecha ? new Date(input.fecha) : undefined,
                estado: input.estado,

                nombre: input.nombre ?? null,
                resumen: input.resumen ?? null,
                lead: input.lead ?? false,

                detalles: input.detalles ?? null,
            },
        });

        return { success: true, data: updated };
    } catch (e: any) {
        return { success: false, message: e?.message ?? "No se pudo actualizar el registro" };
    }
}

export async function deleteRegistro(id: number): Promise<ActionResult<true>> {
    try {
        await db.registro.delete({ where: { id } });
        return { success: true, data: true };
    } catch (e: any) {
        return { success: false, message: e?.message ?? "No se pudo eliminar el registro" };
    }
}

export async function updateRegistroEstado(registroId: number, nuevoEstado: string) {
    try {
        await db.registro.update({
            where: { id: registroId },
            data: { estado: nuevoEstado },
        });

        return {
            success: true,
            message: "Estado actualizado correctamente",
        };
    } catch (error) {
        console.error("[UPDATE_REGISTRO_ESTADO]", error);
        return {
            success: false,
            message: "No se pudo actualizar el estado del registro",
        };
    }
}

export async function getRegistrosByUserId(
    userId: string,
    skip = 0,
    take = 50,
    tipo?: TipoRegistro,
    filters?: RegistrosFilters
) {
    try {
        const estado = (filters?.estado ?? "").trim();
        const leadStatus = filters?.leadStatus;
        const crmFollowUpStatus = filters?.crmFollowUpStatus;
        const query = (filters?.query ?? "").trim();
        const leadOnly = Boolean(filters?.leadOnly);
        const followUpStatus = filters?.followUpStatus;

        const fechaDesde = filters?.fechaDesde
            ? new Date(`${filters.fechaDesde}T00:00:00.000`)
            : null;
        const fechaHasta = filters?.fechaHasta
            ? new Date(`${filters.fechaHasta}T23:59:59.999`)
            : null;

        const fechaWhere =
            fechaDesde || fechaHasta
                ? {
                    ...(fechaDesde ? { gte: fechaDesde } : {}),
                    ...(fechaHasta ? { lte: fechaHasta } : {}),
                }
                : undefined;

        const sessionIdsByFollowUp = await getSessionIdsByFollowUpFilter(
            userId,
            followUpStatus
        );
        const sessionIdsByCrmFollowUp = await getSessionIdsByCrmFollowUpFilter(
            userId,
            crmFollowUpStatus
        );

        if (
            (sessionIdsByFollowUp && sessionIdsByFollowUp.length === 0)
            || (sessionIdsByCrmFollowUp && sessionIdsByCrmFollowUp.length === 0)
        ) {
            return {
                success: true as const,
                data: [],
            };
        }

        const combinedSessionIds =
            sessionIdsByFollowUp && sessionIdsByCrmFollowUp
                ? sessionIdsByFollowUp.filter((id) => sessionIdsByCrmFollowUp.includes(id))
                : sessionIdsByFollowUp ?? sessionIdsByCrmFollowUp ?? null;

        if (combinedSessionIds && combinedSessionIds.length === 0) {
            return {
                success: true as const,
                data: [],
            };
        }

        const whereClauses: Prisma.RegistroWhereInput[] = [
            {
                session: {
                    userId,
                    ...(leadStatus === "none"
                        ? { leadStatus: null }
                        : leadStatus
                            ? { leadStatus }
                            : {}),
                    ...(combinedSessionIds
                        ? { id: { in: combinedSessionIds } }
                        : {}),
                },
            },
        ];

        if (tipo) {
            whereClauses.push({ tipo });
        }

        if (estado) {
            whereClauses.push({ estado });
        }

        if (fechaWhere) {
            whereClauses.push({ fecha: fechaWhere });
        }

        if (leadOnly) {
            whereClauses.push({ lead: true });
        }

        if (query) {
            whereClauses.push({
                OR: [
                    { nombre: { contains: query, mode: "insensitive" } },
                    { resumen: { contains: query, mode: "insensitive" } },
                    { detalles: { contains: query, mode: "insensitive" } },
                    { estado: { contains: query, mode: "insensitive" } },
                    {
                        session: {
                            OR: [
                                { pushName: { contains: query, mode: "insensitive" } },
                                { remoteJid: { contains: query, mode: "insensitive" } },
                                { remoteJidAlt: { contains: query, mode: "insensitive" } },
                                { instanceId: { contains: query, mode: "insensitive" } },
                            ],
                        },
                    },
                ],
            });
        }

        const registros = await db.registro.findMany({
            where: { AND: whereClauses },
            include: {
                session: {
                    include: {
                        registros: true,
                    },
                },
            },
            orderBy: { fecha: "desc" },
            skip,
            take,
        });

        const followUpSummaryMap = await getFollowUpSummaryMapBySessions(
            registros.map((registro) => ({
                remoteJid: registro.session.remoteJid,
                instanceId: registro.session.instanceId,
            }))
        );
        const crmFollowUpSummaryMap = await getCrmFollowUpSummaryMapBySessions(
            registros.map((registro) => ({
                remoteJid: registro.session.remoteJid,
                instanceId: registro.session.instanceId,
            }))
        );

        const data = registros.map((registro) => {
            const summaryKey = buildSessionFollowUpKey(
                registro.session.remoteJid,
                registro.session.instanceId
            );

            return {
                ...registro,
                session: {
                    ...registro.session,
                    followUpSummary: followUpSummaryMap.get(summaryKey) ?? null,
                    crmFollowUpSummary: crmFollowUpSummaryMap.get(summaryKey) ?? null,
                },
            };
        });

        return {
            success: true as const,
            data,
        };
    } catch (error) {
        console.error("[getRegistrosByUserId] Error:", error);

        return {
            success: false as const,
            message: "Error al obtener registros",
        };
    }
}

export async function getCrmDashboardStatsByUserId(userId: string) {
    try {
        // 1) total registros
        const totalRegistros = await db.registro.count({
            where: { session: { userId } },
        });

        // 2) leads con movimientos (distinct sessionId)
        const leadsConMovimientos = await db.registro.groupBy({
            by: ["sessionId"],
            where: { session: { userId } },
        });

        // 3) conteo por tipo
        const byTipo = await db.registro.groupBy({
            by: ["tipo"],
            where: { session: { userId } },
            _count: { _all: true },
        });

        const countsByTipo = {
            REPORTE: 0,
            SOLICITUD: 0,
            PEDIDO: 0,
            RECLAMO: 0,
            PAGO: 0,
            RESERVA: 0,
        } satisfies Record<TipoRegistro, number>;

        for (const row of byTipo) {
            const tipo = row.tipo as TipoRegistro;
            countsByTipo[tipo] = row._count._all;
        }

        // 4) últimos 7 días
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        start.setDate(start.getDate() - 6); // incluye hoy (7 días)

        const last7 = await db.registro.findMany({
            where: { session: { userId }, fecha: { gte: start } },
            select: { fecha: true },
            orderBy: { fecha: "asc" },
        });

        // mapa yyyy-MM-dd => count
        const daysMap = new Map<string, number>();
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        for (let i = 6; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const key = d.toISOString().slice(0, 10);
            daysMap.set(key, 0);
        }

        for (const r of last7) {
            if (!r.fecha) continue;
            const key = r.fecha.toISOString().slice(0, 10);
            if (daysMap.has(key)) daysMap.set(key, (daysMap.get(key) ?? 0) + 1);
        }

        const chartDataByDay = Array.from(daysMap.entries()).map(([key, count]) => ({
            fecha: key.slice(5), // MM-DD
            cantidad: count,
        }));

        const sessions = await db.session.findMany({
            where: { userId },
            select: { remoteJid: true, instanceId: true },
        });

        const uniqueSessionsMap = new Map<string, { remoteJid: string; instanceId: string }>();
        for (const session of sessions) {
            const key = buildSessionFollowUpKey(session.remoteJid, session.instanceId);
            if (!key) continue;
            uniqueSessionsMap.set(key, session);
        }
        const uniqueSessions = Array.from(uniqueSessionsMap.values());

        const followUps = {
            total: 0,
            active: 0,
            pending: 0,
            processing: 0,
            sent: 0,
            failed: 0,
            cancelled: 0,
        };
        const crmFollowUps = {
            total: 0,
            active: 0,
            pending: 0,
            processing: 0,
            sent: 0,
            failed: 0,
            cancelled: 0,
            skipped: 0,
        };

        if (uniqueSessions.length) {
            const followUpCounts = await db.seguimiento.groupBy({
                by: ["followUpStatus"],
                where: {
                    OR: uniqueSessions.map((session) => ({
                        remoteJid: session.remoteJid,
                        instancia: session.instanceId,
                    })),
                },
                _count: { _all: true },
            });

            for (const row of followUpCounts) {
                const status = (row.followUpStatus ?? "pending") as FollowUpStatus;
                const count = row._count._all;
                followUps.total += count;

                if (status === "pending") {
                    followUps.pending += count;
                    followUps.active += count;
                } else if (status === "processing") {
                    followUps.processing += count;
                    followUps.active += count;
                } else if (status === "sent") {
                    followUps.sent += count;
                } else if (status === "failed") {
                    followUps.failed += count;
                } else if (status === "cancelled") {
                    followUps.cancelled += count;
                }
            }

            const crmFollowUpCounts = await db.crmFollowUp.groupBy({
                by: ["status"],
                where: {
                    OR: uniqueSessions.map((session) => ({
                        remoteJid: session.remoteJid,
                        instanceId: session.instanceId,
                    })),
                },
                _count: { _all: true },
            });

            for (const row of crmFollowUpCounts) {
                const status = row.status as CrmFollowUpStatus;
                const count = row._count._all;
                crmFollowUps.total += count;

                if (status === "PENDING") {
                    crmFollowUps.pending += count;
                    crmFollowUps.active += count;
                } else if (status === "PROCESSING") {
                    crmFollowUps.processing += count;
                    crmFollowUps.active += count;
                } else if (status === "SENT") {
                    crmFollowUps.sent += count;
                } else if (status === "FAILED") {
                    crmFollowUps.failed += count;
                } else if (status === "CANCELLED") {
                    crmFollowUps.cancelled += count;
                } else if (status === "SKIPPED") {
                    crmFollowUps.skipped += count;
                }
            }
        }

        return {
            success: true as const,
            data: {
                totalRegistros,
                leadsConMovimientos: leadsConMovimientos.length,
                countsByTipo,
                chartDataByDay,
                followUps,
                crmFollowUps,
            },
        };
    } catch (error) {
        console.error("[getCrmDashboardStatsByUserId] Error:", error);
        return {
            success: false as const,
            message: "Error al obtener estadísticas del CRM",
        };
    }
}

export async function getSessionTagStatsByUserId(userId: string) {
    try {
        // 1) Agrupamos en la tabla pivote SessionTag
        const grouped = await db.sessionTag.groupBy({
            by: ["tagId"],
            _count: { _all: true },
            where: {
                session: { userId }, // solo sesiones del usuario actual
            },
        });

        if (!grouped.length) return { success: true as const, data: [] };

        const tagIds = grouped.map((g) => g.tagId);

        // 2) Traemos info de cada Tag
        const tags = await db.tag.findMany({
            where: { id: { in: tagIds } },
        });

        // 3) Combinamos
        const stats = grouped.map((g) => {
            const tag = tags.find((t) => t.id === g.tagId);
            return {
                tagId: g.tagId,
                name: tag?.name ?? "Sin nombre",
                slug: tag?.slug ?? "",
                color: tag?.color ?? undefined,
                count: g._count._all,
            };
        });

        return {
            success: true as const,
            data: stats,
        };
    } catch (error) {
        console.error("[getSessionTagStatsByUserId] Error:", error);
        return {
            success: false as const,
            message: "Error al obtener estadísticas de tags",
        };
    }
}

export async function updateRegistroDetalle(registroId: number, nuevoDetalle: string) {
    try {
        const registro = await db.registro.findUnique({
            where: { id: registroId },
            select: { tipo: true },
        });

        if (!registro) {
            return {
                success: false,
                message: "Registro no encontrado",
            };
        }

        const detalleValue = normalizeDetalleDraft(nuevoDetalle);

        await db.registro.update({
            where: { id: registroId },
            data:
                registro.tipo === "REPORTE"
                    ? { resumen: detalleValue }
                    : { detalles: detalleValue },
        });

        return {
            success: true,
            message: "Detalle actualizado correctamente",
        };
    } catch (error) {
        console.error("[UPDATE_REGISTRO_DETALLE]", error);
        return {
            success: false,
            message: "No se pudo actualizar el detalle del registro",
        };
    }
}
