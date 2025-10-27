import z from "zod";
import { buildBusinessHeader } from "./buildBusinessHeader";
import { buildExtrasMarkdown } from "./buildExtrasMarkdown";
import { buildFaqMarkdown } from "./buildFaqMarkdown";
import { buildProductsMarkdown } from "./buildProductsMarkdown";
import { buildTrainingMarkdown } from "./buildTrainingMarkdown";
import { nonEmpty } from "./nonEmpty";
import { SectionsDraftSchema } from "@/types/agentAi";

export function composePromptFromSections(sections: z.infer<typeof SectionsDraftSchema>): string {
    if (!nonEmpty(sections.business?.nombre)) {
        return `Completa al menos el nombre del negocio para generar el prompt.`;
    }

    const out: string[] = [];
    out.push(buildBusinessHeader(sections.business));
    out.push(
        `\n## Instrucción\n
        Eres responsable de gestionar, por WhatsApp, toda la información y requerimientos de esta empresa. Responde de forma clara, concisa y accionable usando **exclusivamente** la información de este documento. Si falta un dato, continúa con naturalidad **sin inventarlo**. **Cumple estas instrucciones de manera literal.**

        * Usa **solo** la información disponible; **no inventes** nada.
        * **Sigue el orden fijo**: 1) Detecta intención → 2) Ejecuta el flujo indicado → 3) Cumple la **poscondición**.
        * Si un flujo devuelve mensaje: **reenvíalo literal** como **única respuesta** (sin añadir texto).
        * Si no hay orden clara al enviar un flujo: **haz 1 pregunta contextual mínima** para avanzar hacia la conversión.
        * **No mezcles ni saltes** pasos o flujos y responde con **una sola intervención por turno**, breve, clara y accionable.

        * Mantén **una sola regla operativa única** (compacta):
          *Cuando veas “Ejecuta el Flujo: X”, ejecútalo y **reenvía su salida literal**; si no hay instrucción clara, haz **1** pregunta contextual mínima.*
        * El **checklist** es opcional; ayuda a reducir desvíos en sesiones largas, pero es redundante con tus reglas.`
    );

    const trainingMd = buildTrainingMarkdown(sections.training);
    if (nonEmpty(trainingMd)) {
        out.push('\n## PROCEDIMIENTO OBLIGATORIO (CHATS SIN HISTORIAL)');
        out.push(trainingMd);
    }

    const faqMd = buildFaqMarkdown(sections.faq);
    if (nonEmpty(faqMd)) {
        out.push('\n## PREGUNTAS & RESPUESTAS');
        out.push(faqMd);
    }

    const prodMd = buildProductsMarkdown(sections.products);
    if (nonEmpty(prodMd)) {
        out.push('\n## CATÁLOGO / PRODUCTOS');
        out.push(prodMd);
    }

    const extrasMd = buildExtrasMarkdown(sections.extras);
    if (nonEmpty(extrasMd)) {
        out.push('\n## EXTRAS');
        out.push(extrasMd);
    }

    return out.join('\n');
}
