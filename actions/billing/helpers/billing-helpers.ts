import { Prisma } from "@prisma/client";
import { currentUser } from "@/lib/auth";
import { format } from "date-fns";
import { BillingTemplateType } from "@/types/billing";


/**
 * Helpers (SOLID: auth/guard separado)
 */
export async function requireAuth() {
    const user = await currentUser();
    if (!user) throw new Error("No autorizado.");
    return user;
}

export function assertAdminOrReseller(role?: string | null) {
    if (role !== "admin" && role !== "reseller") {
        throw new Error("No autorizado.");
    }
}

export function toDate(value?: string | Date | null): Date | null {
    if (!value) return null;
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    return d;
}

export function toDecimal(value?: string | number | null): Prisma.Decimal | null {
    if (value === null || value === undefined || value === "") return null;
    try {
        return new Prisma.Decimal(value);
    } catch {
        return null;
    }
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

/**
 * Decide qué plantilla usar:
 * - 3 días antes => REMINDER_3D
 * - día de vencimiento => DUE_TODAY
 * - expirado => EXPIRED (cuando ya pasó y sobrepasó graceDays)
 */
export function pickTemplate(args: {
    daysRemaining: number;
    graceDays: number;
    is3DaysBefore: boolean;
    isDueToday: boolean;
    isExpiredBeyondGrace: boolean;
}): BillingTemplateType | null {
    if (args.is3DaysBefore) return "REMINDER_3D";
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