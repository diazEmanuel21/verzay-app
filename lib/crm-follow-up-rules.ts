import type { LeadStatus } from "@/types/session";

export type CrmFollowUpRuleConfig = {
  id: string;
  userId: string;
  leadStatus: LeadStatus;
  enabled: boolean;
  delayMinutes: number;
  maxAttempts: number;
  goal: string;
  prompt: string;
  fallbackMessage: string;
  allowedWeekdays: number[];
  sendStartTime: string;
  sendEndTime: string;
  updatedAt: string | null;
};

export const CRM_FOLLOW_UP_RULE_STATUS_ORDER: LeadStatus[] = [
  "FRIO",
  "TIBIO",
  "CALIENTE",
  "FINALIZADO",
  "DESCARTADO",
];

export const CRM_FOLLOW_UP_WEEKDAY_OPTIONS = [
  { value: 1, label: "Lun" },
  { value: 2, label: "Mar" },
  { value: 3, label: "Mie" },
  { value: 4, label: "Jue" },
  { value: 5, label: "Vie" },
  { value: 6, label: "Sab" },
  { value: 0, label: "Dom" },
] as const;

export const CRM_FOLLOW_UP_RULE_DEFAULTS: Record<
  LeadStatus,
  Omit<CrmFollowUpRuleConfig, "id" | "userId" | "leadStatus" | "updatedAt">
> = {
  FRIO: {
    enabled: true,
    delayMinutes: 24 * 60,
    maxAttempts: 1,
    goal: "Reactivar la conversacion sin presionar y detectar si sigue habiendo interes real.",
    prompt:
      "Escribe breve, cordial y sin insistencia. Menciona valor util, evita sonar automatizado y termina con una pregunta simple.",
    fallbackMessage:
      "Hola, te escribo para saber si aun te interesa retomar esta conversacion.",
    allowedWeekdays: [1, 2, 3, 4, 5],
    sendStartTime: "09:00",
    sendEndTime: "18:00",
  },
  TIBIO: {
    enabled: true,
    delayMinutes: 6 * 60,
    maxAttempts: 2,
    goal: "Mover al lead al siguiente paso comercial con claridad y una llamada a la accion concreta.",
    prompt:
      "Usa un tono consultivo. Resume el punto mas util del contexto y cierra con una pregunta concreta para avanzar.",
    fallbackMessage:
      "Hola, sigo atento para ayudarte a avanzar con la informacion que necesitas.",
    allowedWeekdays: [1, 2, 3, 4, 5],
    sendStartTime: "09:00",
    sendEndTime: "18:00",
  },
  CALIENTE: {
    enabled: true,
    delayMinutes: 60,
    maxAttempts: 2,
    goal: "Cerrar el siguiente paso comercial cuanto antes con urgencia medida y claridad.",
    prompt:
      "Se directo, humano y comercial. Prioriza cierre o agendamiento. No des demasiadas opciones.",
    fallbackMessage:
      "Hola, si quieres lo dejamos listo ahora mismo. Dime y avanzamos con el siguiente paso.",
    allowedWeekdays: [1, 2, 3, 4, 5],
    sendStartTime: "09:00",
    sendEndTime: "18:00",
  },
  FINALIZADO: {
    enabled: false,
    delayMinutes: 0,
    maxAttempts: 0,
    goal: "",
    prompt: "",
    fallbackMessage: "",
    allowedWeekdays: [1, 2, 3, 4, 5],
    sendStartTime: "09:00",
    sendEndTime: "18:00",
  },
  DESCARTADO: {
    enabled: false,
    delayMinutes: 0,
    maxAttempts: 0,
    goal: "",
    prompt: "",
    fallbackMessage: "",
    allowedWeekdays: [1, 2, 3, 4, 5],
    sendStartTime: "09:00",
    sendEndTime: "18:00",
  },
};

export function generateCrmFollowUpTimeOptions() {
  const values: string[] = [];

  for (let hour = 0; hour < 24; hour += 1) {
    for (let minute = 0; minute < 60; minute += 30) {
      values.push(
        `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
      );
    }
  }

  return values;
}

export function sanitizeCrmFollowUpWeekdays(value?: number[] | null) {
  const normalized = Array.from(
    new Set(
      (value ?? []).filter(
        (item): item is number =>
          Number.isInteger(item) && item >= 0 && item <= 6
      )
    )
  ).sort((a, b) => a - b);

  return normalized.length ? normalized : [1, 2, 3, 4, 5];
}

export function sanitizeCrmFollowUpTimeValue(
  value: string | null | undefined,
  fallback: string
) {
  const clean = String(value ?? "").trim();
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(clean) ? clean : fallback;
}

export function normalizeCrmFollowUpRule(input: {
  id?: string | null;
  userId: string;
  leadStatus: LeadStatus;
  enabled?: boolean;
  delayMinutes?: number;
  maxAttempts?: number;
  goal?: string | null;
  prompt?: string | null;
  fallbackMessage?: string | null;
  allowedWeekdays?: number[] | null;
  sendStartTime?: string | null;
  sendEndTime?: string | null;
  updatedAt?: string | null;
}): CrmFollowUpRuleConfig {
  const defaults = CRM_FOLLOW_UP_RULE_DEFAULTS[input.leadStatus];

  return {
    id: String(input.id ?? ""),
    userId: String(input.userId ?? "").trim(),
    leadStatus: input.leadStatus,
    enabled: input.enabled ?? defaults.enabled,
    delayMinutes: Math.min(
      Math.max(Number(input.delayMinutes ?? defaults.delayMinutes) || 0, 0),
      60 * 24 * 30
    ),
    maxAttempts: Math.min(
      Math.max(Number(input.maxAttempts ?? defaults.maxAttempts) || 0, 0),
      10
    ),
    goal: String(input.goal ?? defaults.goal).trim(),
    prompt: String(input.prompt ?? defaults.prompt).trim(),
    fallbackMessage: String(
      input.fallbackMessage ?? defaults.fallbackMessage
    ).trim(),
    allowedWeekdays: sanitizeCrmFollowUpWeekdays(
      input.allowedWeekdays ?? defaults.allowedWeekdays
    ),
    sendStartTime: sanitizeCrmFollowUpTimeValue(
      input.sendStartTime,
      defaults.sendStartTime
    ),
    sendEndTime: sanitizeCrmFollowUpTimeValue(
      input.sendEndTime,
      defaults.sendEndTime
    ),
    updatedAt: input.updatedAt ?? null,
  };
}
