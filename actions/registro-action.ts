"use server";

import { db } from "@/lib/db";
import { ActionResult } from "@/types/registro";
import { TipoRegistro } from "@/types/session";

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
    take = 50
) {
    try {
        const registros = await db.registro.findMany({
            where: {
                session: {
                    userId,
                },
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