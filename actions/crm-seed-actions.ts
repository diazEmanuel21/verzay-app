"use server";

import { db } from "@/lib/db";
import { CrmSeedData, demoCrmSeedData } from "@/types/crm";
import { ClienteEstado } from "@prisma/client";

/**
 * SERVER ACTION
 * Inserta/actualiza Sessions, Clientes y Registros
 * usando el JSON de arriba (o el que le pases).
 */

export const seedCrmDataAction = async (userId: string, data?: CrmSeedData) => {
    const seed = data ?? demoCrmSeedData;

    // 1) Crear / asegurar Sessions
    const sessionMap = new Map<string, number>(); // remoteJid -> sessionId

    for (const s of seed.sessions) {
        const existing = await db.session.findFirst({
            where: {
                userId,
                remoteJid: s.remoteJid,
            },
        });

        let session;
        if (existing) {
            session = existing;
        } else {
            session = await db.session.create({
                data: {
                    userId,
                    remoteJid: s.remoteJid,
                    pushName: s.pushName,
                    instanceId: s.instanceId,
                    status: s.status,
                    // el resto de campos opcionales quedan con sus defaults
                },
            });
        }

        sessionMap.set(s.remoteJid, session.id);
    }

    // 2) Crear Clientes (1:1 por Session) si no existen
    for (const c of seed.clientes) {
        const sessionId = sessionMap.get(c.sessionRemoteJid);
        if (!sessionId) {
            // si por alguna razón no existe session, lo saltamos
            // (puedes lanzar error si prefieres)
            continue;
        }

        const existingCliente = await db.cliente.findUnique({
            where: {
                sessionId,
            },
        });

        if (existingCliente) {
            // Si existe, lo dejamos tal cual o podrías actualizarlo aquí
            continue;
        }

        await db.cliente.create({
            data: {
                sessionId,
                nombre: c.nombre ?? null,
                whatsapp: c.whatsapp ?? null,
                empresa: c.empresa ?? null,
                correo: c.correo ?? null,
                detalles: c.detalles ?? null,
                estado: c.estado ?? ClienteEstado.ACTIVO,
            },
        });
    }

    // 3) Crear Registros asociados a Session
    for (const r of seed.registros) {
        const sessionId = sessionMap.get(r.sessionRemoteJid);
        if (!sessionId) {
            continue;
        }

        await db.registro.create({
            data: {
                tipo: r.tipo,
                fecha: new Date(r.fecha),
                estado: r.estado,
                resumen: r.resumen ?? null,
                lead: r.lead ?? null,
                nombre: r.nombre ?? null,
                detalles: r.detalles ?? null,
                meta: r.meta ?? undefined,
                session: {
                    connect: { id: sessionId },
                },
            },
        });
    }

    return {
        ok: true,
        sessionsCreatedOrUsed: seed.sessions.length,
        clientesSeeded: seed.clientes.length,
        registrosSeeded: seed.registros.length,
    };
}
