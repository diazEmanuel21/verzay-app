import { ESTADOS_POR_TIPO } from "@/types/registro";
import type { FollowUpStatus } from "@/types/session";

import type { CrmDashboardTab, CrmTableColumnId } from "./types";

export const CRM_TABS = [
    "TODOS",
    "REPORTE",
    "SOLICITUD",
    "PEDIDO",
    "RECLAMO",
    "PAGO",
    "RESERVA",
] as const;

export const CRM_TAB_COLORS: Record<CrmDashboardTab, string> = {
    TODOS: "#374151",
    REPORTE: "#3B82F6",
    SOLICITUD: "#8B5CF6",
    PEDIDO: "#F97316",
    RECLAMO: "#EF4444",
    PAGO: "#22C55E",
    RESERVA: "#0EA5E9",
};

export const FOLLOW_UP_FILTER_OPTIONS: Array<{
    value: FollowUpStatus | "none";
    label: string;
}> = [
    { value: "pending", label: "Pendiente" },
    { value: "processing", label: "Procesando" },
    { value: "sent", label: "Enviado" },
    { value: "failed", label: "Fallido" },
    { value: "cancelled", label: "Cancelado" },
    { value: "none", label: "Sin follow-up" },
];

export const CRM_TABLE_COLUMN_LABELS: Record<CrmTableColumnId, string> = {
    whatsapp: "WhatsApp",
    nombre: "Nombre",
    tipo: "Tipo",
    fecha: "Fecha",
    detalle: "Detalle",
    followUp: "Follow-up",
    estado: "Estado",
};

export const CRM_DEFAULT_COLUMN_VISIBILITY: Record<CrmTableColumnId, boolean> = {
    whatsapp: true,
    nombre: true,
    tipo: true,
    fecha: true,
    detalle: true,
    followUp: true,
    estado: true,
};

export const CRM_COLUMN_VISIBILITY_STORAGE_KEY =
    "crm-dashboard-records-column-visibility";

export function isCrmTabValue(value: string): value is CrmDashboardTab {
    return (CRM_TABS as readonly string[]).includes(value);
}

export function canUseLeadFilter(tab: CrmDashboardTab) {
    return tab === "TODOS" || tab === "REPORTE";
}

export function getEstadoOptionsForTab(activeTab: CrmDashboardTab) {
    if (activeTab === "TODOS") {
        const all = new Set<string>();

        for (const estados of Object.values(ESTADOS_POR_TIPO)) {
            for (const estado of estados) {
                all.add(estado);
            }
        }

        return Array.from(all).sort((a, b) => a.localeCompare(b, "es"));
    }

    return ESTADOS_POR_TIPO[activeTab] ?? [];
}
