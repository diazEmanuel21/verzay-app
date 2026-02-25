/**
 * Formato estándar de respuesta (backend)
 */
export interface ResponseFormat<T> {
    success: boolean;
    message: string;
    data?: T;
}

export type BillingTemplateType = "REMINDER_3D" | "DUE_TODAY" | "EXPIRED";

/**
 * Tipos de entrada (sin Zod por ahora para no meter dependencias extra aquí)
 */
export type BillingUpsertInput = {
    userId: string;
    price?: string | number | null; // lo convertimos a Decimal
    currencyCode?: string | null;
    paymentMethodLabel?: string | null;
    paymentNotes?: string | null;
    dueDate?: string | Date | null;
    billingStatus?: "PAID" | "UNPAID";
    accessStatus?: "ACTIVE" | "SUSPENDED";
    graceDays?: number | null;
    suspendedReason?: string | null;
};
