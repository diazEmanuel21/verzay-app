import z from "zod";
import { buildBusinessHeader } from "./buildBusinessHeader";
import { nonEmpty } from "./nonEmpty";
import { SectionsDraftSchema } from "@/types/agentAi";
import { buildExtrasMarkdown, buildFaqMarkdown, buildProductsMarkdown, buildTrainingMarkdown } from "./actionsBuilders";

export function composePromptFromSections(sections: z.infer<typeof SectionsDraftSchema>): string {
    if (!nonEmpty(sections.business?.nombre)) {
        return `Completa al menos el nombre del negocio para generar el prompt.`;
    }

    const out: string[] = [];
    out.push(buildBusinessHeader(sections.business));
    out.push(
        `\n## INSTRUCCIÓN\n
Adhiérete *estrictamente* a los *pasos de conversación (Usuario ⇄ IA)* provistos para este negocio, *sin saltar ni mezclar* pasos, respetando *funciones, **salidas literales* y *comportamientos*.

*Parámetros de entrada (los provee quien invoca):*

* *[Contexto breve]:* ‘escenario / canal / notas’.
* *[Flujo/Pasos]:* bloque con pasos *numerados* y sus reglas (puede incluir *funciones, **salidas literales, **comportamientos, **validaciones, **fallbacks*).
* *[Variables requeridas]:* ‘lista de variables esperadas: nombre, ciudad, producto, etc.’
* *{características}:* estilo *profesional, tono **neutral, y ejemplo **breve y accionable* usando *exclusivamente* la información de este documento.

Si falta un dato, *solicita la mínima aclaración necesaria* y continúa con naturalidad; *no inventes*.
`);

    const trainingMd = buildTrainingMarkdown(sections.training);
    if (nonEmpty(trainingMd)) {
        out.push('## PROCEDIMIENTO OBLIGATORIO (CHATS SIN HISTORIAL)\n');
        out.push(trainingMd);
    }

    const faqMd = buildFaqMarkdown(sections.faq);
    if (nonEmpty(faqMd)) {
        out.push('\n## PREGUNTAS & RESPUESTAS\n');
        out.push(faqMd);
    }

    const prodMd = buildProductsMarkdown(sections.products);
    if (nonEmpty(prodMd)) {
        out.push('\n## CATÁLOGO / PRODUCTOS\n');
        out.push(prodMd);
    }

    const extrasMd = buildExtrasMarkdown(sections.extras);
    if (nonEmpty(extrasMd)) {
        out.push('\n## EXTRAS\n');
        out.push(extrasMd);
    }

    return out.join('\n');
}
