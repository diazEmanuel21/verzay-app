// app/actions/billing-preview-actions.ts
"use server";

import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isAdminOrReseller } from "@/lib/rbac";
import { differenceInCalendarDays } from "date-fns";
import { BillingTemplateType, ResponseFormat } from "@/types/billing";
import { buildBillingMessage } from "./billing-message-templates";
import { pickPreviewTemplate } from "./helpers/billing-helpers";



export async function previewBillingReminderMessage(
    userId: string
): Promise<ResponseFormat<{ text: string; template: BillingTemplateType; daysRemaining: number }>> {
    try {
        const me = await currentUser();
        if (!me) return { success: false, message: "No autorizado." };
        if (!isAdminOrReseller(me.role))
            return { success: false, message: "No autorizado." };

        const billing = await db.userBilling.findUnique({
            where: { userId },
            include: {
                user: { select: { name: true, company: true, plan: true } },
            },
        });

        if (!billing?.dueDate) {
            return { success: false, message: "Cliente sin dueDate configurado." };
        }

        const now = new Date();
        const due = new Date(billing.dueDate);
        const daysRemaining = differenceInCalendarDays(due, now);

        const paymentText =
            (billing.paymentNotes?.trim() ||
                billing.paymentMethodLabel?.trim() ||
                "").trim() || "—";

        const template = pickPreviewTemplate(daysRemaining, Number(billing.graceDays || 0));

        // Por ahora igual que el job: fijo (luego lo hacemos dinámico por plan)
        const planLabel = billing.serviceName ? `🤖 ${billing.serviceName}` : `🤖 Agente IA`;
        const licenseLabel = `🗓️ Licencia 30 días`;
        const currencyFlag = billing.currencyCode === "USD" ? "🇺🇸" : null;

        const text = buildBillingMessage({
            type: template,
            dueDate: due,
            daysRemaining,
            planLabel,
            licenseLabel,
            price: billing.price,
            currencyCode: billing.currencyCode || "COP",
            currencyFlag,
            paymentLinkOrText: paymentText,
            clientName: billing.user.name || billing.user.company || "Cliente",
        });

        return {
            success: true,
            message: "Vista previa generada.",
            data: { text, template, daysRemaining },
        };
    } catch (e: any) {
        console.error("[previewBillingReminderMessage]", e);
        return { success: false, message: e?.message ?? "Error generando vista previa." };
    }
}
