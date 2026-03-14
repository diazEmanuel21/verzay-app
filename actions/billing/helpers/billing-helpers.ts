import { format } from "date-fns";
import { BillingTemplateType } from "@/types/billing";


export function toDate(value?: string | Date | null): Date | null {
    if (!value) return null;

    // Si viene del <input type="date"> => "YYYY-MM-DD"
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        // Mediodía UTC evita el shift al día anterior en zonas -05:00
        return new Date(`${value}T12:00:00.000Z`);
    }

    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    return d;
}

export function fmtDateDDMMYYYY(date: Date) {
    return format(date, "dd/MM/yyyy");
}

/**
 * OJO: tu ejemplo muestra "$99.50 USD 🇺🇸"
 * Para no inventar banderas, aquí dejamos el "flag" como opcional.
 */
export function fmtPriceLine(args: { price: any; currencyCode: string; currencyFlag?: string | null }) {
    const priceStr = args.price ? String(args.price) : "—";
    const flag = args.currencyFlag ? ` ${args.currencyFlag}` : "";
    return `💵 $${priceStr} ${args.currencyCode}${flag}`;
}

export function onlyDigitsPhone(value: string) {
    return (value ?? "").replace(/[^\d]/g, "");
}

export function normalizeWhatsAppJid(value: string) {
    const raw = (value ?? "").trim();
    if (!raw) return "";
    if (raw.includes("@")) return raw;
    const digits = onlyDigitsPhone(raw);
    if (!digits) return "";
    return `${digits}@s.whatsapp.net`;
}

/**
 * Decide qué plantilla usar:
 * - 3 días antes => REMINDER_3D
 * - día de vencimiento => DUE_TODAY
 * - expirado => EXPIRED (cuando ya pasó y sobrepasó graceDays)
 */
export function pickTemplate(args: {
    daysRemaining: number;
    graceDays: number;
    isDaysBefore: boolean;
    isDueToday: boolean;
    isExpiredBeyondGrace: boolean;
}): BillingTemplateType | null {
    if (args.isDaysBefore) return "REMINDER_3D";
    if (args.isDueToday) return "DUE_TODAY";
    if (args.isExpiredBeyondGrace) return "EXPIRED";
    return null;
}

export function pickPreviewTemplate(daysRemaining: number, graceDays: number): BillingTemplateType {
    // Vista previa coherente con el job:
    // 3 => recordatorio 3 días antes
    // 0 => hoy vence
    // <= -graceDays (y graceDays>0) => expirado
    if (daysRemaining === 3) return "REMINDER_3D";
    if (daysRemaining === 0) return "DUE_TODAY";
    if (graceDays > 0 && daysRemaining <= -graceDays && daysRemaining < 0) return "EXPIRED";
    // default: si no cae en un caso especial, mostramos el recordatorio “normal”
    return "REMINDER_3D";
}

export function safeDate(d?: string | Date | null) {
    if (!d) return null;
    const dd = d instanceof Date ? d : new Date(d);
    if (Number.isNaN(dd.getTime())) return null;
    return dd;
}

export function fmtDateShort(d?: string | Date | null) {
    const dd = safeDate(d);
    if (!dd) return "—";
    return format(dd, "yyyy-MM-dd");
}

export function money(price?: string | null, code?: string) {
    if (!price) return "—";
    return `${price} ${code ?? ""}`.trim();
}

export function serializeUserBilling(u: any) {
    const b = u.billing;
    if (!b) return { ...u, billing: null };

    return {
        ...u,
        billing: {
            ...b,
            price: b.price ? b.price.toString() : null,

            dueDate: b.dueDate ? b.dueDate.toISOString() : null,
            serviceStartAt: b.serviceStartAt ? b.serviceStartAt.toISOString() : null,
            serviceEndAt: b.serviceEndAt ? b.serviceEndAt.toISOString() : null,
            serviceEndsAt: b.serviceEndsAt ? b.serviceEndsAt.toISOString() : null,
            suspendedAt: b.suspendedAt ? b.suspendedAt.toISOString() : null,
            lastPaymentAt: b.lastPaymentAt ? b.lastPaymentAt.toISOString() : null,
            lastReminderAt: b.lastReminderAt ? b.lastReminderAt.toISOString() : null,
            lastReminderDueDate: b.lastReminderDueDate ? b.lastReminderDueDate.toISOString() : null,
            createdAt: b.createdAt ? b.createdAt.toISOString() : null,
            updatedAt: b.updatedAt ? b.updatedAt.toISOString() : null,
        },
    };
};
