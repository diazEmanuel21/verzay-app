/**
 * DATA DE EJEMPLO QUE SE CARGARÁ
 */

import { ClienteEstado, TipoRegistro } from "@prisma/client";

export type CrmSeedSession = {
    remoteJid: string;
    pushName: string;
    instanceId: string;
    status: boolean;
};

export type CrmSeedCliente = {
    sessionRemoteJid: string;
    nombre?: string | null;
    whatsapp?: string | null;
    empresa?: string | null;
    correo?: string | null;
    detalles?: string | null;
    estado?: ClienteEstado;
};

export type CrmSeedRegistro = {
    sessionRemoteJid: string;
    tipo: TipoRegistro;
    fecha: string; // ISO string
    estado: string;
    resumen?: string | null;
    lead?: boolean | null;
    nombre?: string | null;
    detalles?: string | null;
    meta?: Record<string, any> | null;
};

export type CrmSeedData = {
    sessions: CrmSeedSession[];
    clientes: CrmSeedCliente[];
    registros: CrmSeedRegistro[];
};


// 🔹 DATA DEMO (ajústala a tu gusto)
export const demoCrmSeedData: CrmSeedData = {
    sessions: [
        {
            remoteJid: "573001112233@s.whatsapp.net",
            pushName: "Juan Pérez",
            instanceId: "instance-demo-1",
            status: true,
        },
        {
            remoteJid: "573009998877@s.whatsapp.net",
            pushName: "María López",
            instanceId: "instance-demo-1",
            status: true,
        },
        {
            remoteJid: "584147778899@s.whatsapp.net",
            pushName: "Carlos García",
            instanceId: "instance-demo-2",
            status: true,
        },
    ],
    clientes: [
        {
            sessionRemoteJid: "573001112233@s.whatsapp.net",
            nombre: "Juan Pérez",
            whatsapp: "573001112233",
            empresa: "Verzay",
            correo: "juan@cliente.com",
            detalles: "Cliente interesado en agentes IA para WhatsApp.",
            estado: ClienteEstado.ACTIVO,
        },
        {
            sessionRemoteJid: "573009998877@s.whatsapp.net",
            nombre: "María López",
            whatsapp: "573009998877",
            empresa: "Holi Print RD",
            correo: "maria@holiprint.com",
            detalles: "Solicitó información sobre automatización de cotizaciones.",
            estado: ClienteEstado.PROSPECTO,
        },
    ],
    registros: [
        // Juan - REPORTE
        {
            sessionRemoteJid: "573001112233@s.whatsapp.net",
            tipo: TipoRegistro.REPORTE,
            fecha: "2025-11-10T09:30:00.000Z",
            estado: "Abierto",
            resumen: "Reporta problema con integración de WhatsApp.",
            lead: true,
            nombre: "Juan Pérez",
            detalles: null,
            meta: null,
        },
        // Juan - SOLICITUD
        {
            sessionRemoteJid: "573001112233@s.whatsapp.net",
            tipo: TipoRegistro.SOLICITUD,
            fecha: "2025-11-11T14:20:00.000Z",
            estado: "En proceso",
            resumen: null,
            lead: null,
            nombre: null,
            detalles: "Solicitud de demo para IA en WhatsApp.",
            meta: null,
        },
        // Juan - PEDIDO
        {
            sessionRemoteJid: "573001112233@s.whatsapp.net",
            tipo: TipoRegistro.PEDIDO,
            fecha: "2025-11-12T10:05:00.000Z",
            estado: "Pagado",
            resumen: null,
            lead: null,
            nombre: null,
            detalles: "Pedido de agente IA personalizado (plan Pro).",
            meta: { plan: "Pro", importeUSD: 150 },
        },
        // Juan - PAGO
        {
            sessionRemoteJid: "573001112233@s.whatsapp.net",
            tipo: TipoRegistro.PAGO,
            fecha: "2025-11-12T11:00:00.000Z",
            estado: "Confirmado",
            resumen: null,
            lead: null,
            nombre: null,
            detalles: "Pago por suscripción mensual.",
            meta: { metodo: "Zelle", referencia: "ZL-12345" },
        },
        // María - RECLAMO
        {
            sessionRemoteJid: "573009998877@s.whatsapp.net",
            tipo: TipoRegistro.RECLAMO,
            fecha: "2025-11-13T16:40:00.000Z",
            estado: "Pendiente",
            resumen: null,
            lead: null,
            nombre: null,
            detalles: "No recibe notificaciones en el CRM.",
            meta: null,
        },
        // Carlos - RESERVA
        {
            sessionRemoteJid: "584147778899@s.whatsapp.net",
            tipo: TipoRegistro.RESERVA,
            fecha: "2025-11-14T15:00:00.000Z",
            estado: "Reservado",
            resumen: null,
            lead: null,
            nombre: null,
            detalles: "Reserva de sesión de onboarding.",
            meta: { canal: "Zoom" },
        },
    ],
};

