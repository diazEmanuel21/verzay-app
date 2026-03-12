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

const DEFAULT_CRM_FOLLOW_UP_TIMEZONE = "America/Bogota";
const CRM_FOLLOW_UP_WEEKDAY_MAP: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

type CrmFollowUpZonedParts = {
  year: number;
  month: number;
  day: number;
  weekday: number;
  hour: number;
  minute: number;
  second: number;
};

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

export function sanitizeCrmFollowUpTimezone(timezone?: string | null) {
  const clean = String(timezone ?? "").trim();
  return clean || DEFAULT_CRM_FOLLOW_UP_TIMEZONE;
}

function parseCrmFollowUpTimeToMinutes(value: string) {
  const [hourText, minuteText] = value.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);

  if (!Number.isInteger(hour) || !Number.isInteger(minute)) {
    return 0;
  }

  return hour * 60 + minute;
}

function getCrmFollowUpZonedParts(date: Date, timeZone: string): CrmFollowUpZonedParts {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const parts = formatter.formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";

  return {
    year: Number(read("year")),
    month: Number(read("month")),
    day: Number(read("day")),
    weekday: CRM_FOLLOW_UP_WEEKDAY_MAP[read("weekday")] ?? 0,
    hour: Number(read("hour")),
    minute: Number(read("minute")),
    second: Number(read("second")),
  };
}

function getCrmFollowUpTimezoneOffsetMs(date: Date, timeZone: string) {
  const zoned = getCrmFollowUpZonedParts(date, timeZone);
  const utcFromLocal = Date.UTC(
    zoned.year,
    zoned.month - 1,
    zoned.day,
    zoned.hour,
    zoned.minute,
    zoned.second
  );

  return utcFromLocal - date.getTime();
}

function crmFollowUpZonedDateTimeToUtc(args: {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second?: number;
  timeZone: string;
}) {
  const guess = new Date(
    Date.UTC(args.year, args.month - 1, args.day, args.hour, args.minute, args.second ?? 0)
  );
  const initialOffset = getCrmFollowUpTimezoneOffsetMs(guess, args.timeZone);
  const firstPass = new Date(guess.getTime() - initialOffset);
  const correctedOffset = getCrmFollowUpTimezoneOffsetMs(firstPass, args.timeZone);

  if (correctedOffset === initialOffset) {
    return firstPass;
  }

  return new Date(guess.getTime() - correctedOffset);
}

export function isWithinCrmFollowUpWindow(args: {
  date: Date;
  timeZone?: string | null;
  allowedWeekdays?: number[] | null;
  sendStartTime?: string | null;
  sendEndTime?: string | null;
}) {
  const timeZone = sanitizeCrmFollowUpTimezone(args.timeZone);
  const allowedWeekdays = sanitizeCrmFollowUpWeekdays(args.allowedWeekdays);
  const sendStartTime = sanitizeCrmFollowUpTimeValue(args.sendStartTime, "09:00");
  const sendEndTime = sanitizeCrmFollowUpTimeValue(args.sendEndTime, "18:00");

  const zoned = getCrmFollowUpZonedParts(args.date, timeZone);
  const localMinutes = zoned.hour * 60 + zoned.minute;
  const startMinutes = parseCrmFollowUpTimeToMinutes(sendStartTime);
  const endMinutes = parseCrmFollowUpTimeToMinutes(sendEndTime);

  return (
    allowedWeekdays.includes(zoned.weekday) &&
    localMinutes >= startMinutes &&
    localMinutes <= endMinutes
  );
}

export function computeNextCrmFollowUpDate(args: {
  baseDate: Date;
  timeZone?: string | null;
  allowedWeekdays?: number[] | null;
  sendStartTime?: string | null;
  sendEndTime?: string | null;
}) {
  const timeZone = sanitizeCrmFollowUpTimezone(args.timeZone);
  const allowedWeekdays = sanitizeCrmFollowUpWeekdays(args.allowedWeekdays);
  const sendStartTime = sanitizeCrmFollowUpTimeValue(args.sendStartTime, "09:00");
  const sendEndTime = sanitizeCrmFollowUpTimeValue(args.sendEndTime, "18:00");

  if (
    isWithinCrmFollowUpWindow({
      date: args.baseDate,
      timeZone,
      allowedWeekdays,
      sendStartTime,
      sendEndTime,
    })
  ) {
    return args.baseDate;
  }

  const [startHourText, startMinuteText] = sendStartTime.split(":");
  const startHour = Number(startHourText);
  const startMinute = Number(startMinuteText);
  const baseZoned = getCrmFollowUpZonedParts(args.baseDate, timeZone);
  const calendarBase = new Date(Date.UTC(baseZoned.year, baseZoned.month - 1, baseZoned.day));

  for (let offset = 0; offset < 21; offset += 1) {
    const localDate = new Date(calendarBase.getTime() + offset * 24 * 60 * 60 * 1000);
    const weekday = localDate.getUTCDay();

    if (!allowedWeekdays.includes(weekday)) {
      continue;
    }

    const candidate = crmFollowUpZonedDateTimeToUtc({
      year: localDate.getUTCFullYear(),
      month: localDate.getUTCMonth() + 1,
      day: localDate.getUTCDate(),
      hour: startHour,
      minute: startMinute,
      timeZone,
    });

    if (candidate.getTime() >= args.baseDate.getTime()) {
      return candidate;
    }
  }

  return args.baseDate;
}

export function computeCrmFollowUpScheduledFor(args: {
  delayMinutes: number;
  timeZone?: string | null;
  allowedWeekdays?: number[] | null;
  sendStartTime?: string | null;
  sendEndTime?: string | null;
  from?: Date;
}) {
  const delayMinutes = Math.max(Number(args.delayMinutes) || 0, 0);
  const from = args.from ?? new Date();
  const baseDate = new Date(from.getTime() + delayMinutes * 60_000);

  return computeNextCrmFollowUpDate({
    baseDate,
    timeZone: args.timeZone,
    allowedWeekdays: args.allowedWeekdays,
    sendStartTime: args.sendStartTime,
    sendEndTime: args.sendEndTime,
  });
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
