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
        `\n## Instrucción\nActúa como asistente encargado de gestionar información y pedidos por WhatsApp. Construye respuestas claras, concisas y accionables usando solo los datos suministrados arriba. Si algún dato falta, continúa con naturalidad sin inventarlo.`
    );

    const trainingMd = buildTrainingMarkdown(sections.training);
    if (nonEmpty(trainingMd)) {
        out.push('\n## ENTRENAMIENTO');
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
