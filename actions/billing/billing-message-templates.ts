// app/actions/billing-message-templates.ts
"use server";

import { BillingTemplateType } from "@/types/billing";
import { fmtDateDDMMYYYY, fmtPriceLine } from "./helpers/billing-helpers";



export function buildBillingMessage(args: {
    type: BillingTemplateType;
    dueDate: Date;
    daysRemaining: number; // puede ser negativo
    planLabel: string; // ej: "🤖 Agente IA" (o lo que quieras)
    licenseLabel: string; // ej: "🗓️ Licencia 30 días"
    price: any;
    currencyCode: string; // ej: "USD"
    currencyFlag?: string | null; // ej: "🇺🇸"
    paymentLinkOrText: string; // ej: "https://..."
    clientName?: string | null; // solo para REMINDER_3D si quieres
}) {
    const {
        type,
        dueDate,
        daysRemaining,
        planLabel,
        licenseLabel,
        price,
        currencyCode,
        currencyFlag,
        paymentLinkOrText,
        clientName,
    } = args;

    const header =
        type === "REMINDER_3D"
            ? `👨🏻‍💼 ${clientName || "Cliente"}:`
            : type === "DUE_TODAY"
                ? `🔔 Hoy vence su servicio:`
                : `🚫 Servicio expirado:`;

    return [
        header,
        type === "REMINDER_3D" ? `📋 Detalles de su servicio:` : "",
        `--------•--------•--------•--------`,
        `📆 Vence: ${fmtDateDDMMYYYY(dueDate)}`,
        `⏳ Dias restantes: ${daysRemaining}`,
        `--------•--------•--------•--------`,
        `${planLabel}`,
        `${licenseLabel}`,
        fmtPriceLine({ price, currencyCode, currencyFlag }),
        `--------•--------•--------•--------`,
        `💱 Medios de pago:`,
        `👉${paymentLinkOrText}`,
        `--------•--------•--------•--------`,
        `Una vez realizado el pago, envíe el comprobante a este chat`,
    ]
        .filter(Boolean)
        .join("\n");
}