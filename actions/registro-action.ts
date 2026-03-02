"use server";

import { db } from "@/lib/db";
import { ActionResult } from "@/types/registro";
import { TipoRegistro } from "@/types/session";

export type RegistrosFilters = {
    estado?: string;
    fechaDesde?: string;
    fechaHasta?: string;
};

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

        const registros = await db.registro.findMany({
            where: {
                session: {
                    userId,
                },
                ...(tipo ? { tipo } : {}),
                ...(estado ? { estado } : {}),
                ...(fechaWhere ? { fecha: fechaWhere } : {}),
            },
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

        return {
            success: true as const,
            data: registros,
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

        return {
            success: true as const,
            data: {
                totalRegistros,
                leadsConMovimientos: leadsConMovimientos.length,
                countsByTipo,
                chartDataByDay,
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
