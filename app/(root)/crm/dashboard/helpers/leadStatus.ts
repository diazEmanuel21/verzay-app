import type { LeadStatus } from "@/types/session";

export const LEAD_STATUS_FILTER_OPTIONS: Array<{
  value: LeadStatus;
  label: string;
}> = [
  { value: "FRIO", label: "Frio" },
  { value: "TIBIO", label: "Tibio" },
  { value: "CALIENTE", label: "Caliente" },
  { value: "FINALIZADO", label: "Finalizado" },
  { value: "DESCARTADO", label: "Descartado" },
];

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  FRIO: "Frio",
  TIBIO: "Tibio",
  CALIENTE: "Caliente",
  FINALIZADO: "Finalizado",
  DESCARTADO: "Descartado",
};

export const LEAD_STATUS_BADGE_CLASSNAMES: Record<LeadStatus, string> = {
  FRIO: "border-slate-300 bg-slate-100 text-slate-700",
  TIBIO: "border-amber-300 bg-amber-100 text-amber-800",
  CALIENTE: "border-rose-300 bg-rose-100 text-rose-700",
  FINALIZADO: "border-emerald-300 bg-emerald-100 text-emerald-700",
  DESCARTADO: "border-zinc-300 bg-zinc-100 text-zinc-700",
};

export function getLeadStatusLabel(status?: LeadStatus | null) {
  if (!status) return "Sin clasificar";
  return LEAD_STATUS_LABELS[status];
}
