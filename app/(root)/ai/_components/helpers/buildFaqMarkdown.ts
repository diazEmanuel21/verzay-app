import z from "zod";
import { nonEmpty } from "./nonEmpty";
import { FaqDraftSchema } from "@/types/agentAi";

export function buildFaqMarkdown(faq: z.infer<typeof FaqDraftSchema>): string {
    const blocks = (faq.items ?? [])
        .filter((f) => nonEmpty(f.q) || nonEmpty(f.a))
        .map((f) => `### ${nonEmpty(f.q) || '(Pregunta)'}\n${nonEmpty(f.a) || '(Respuesta)'}`);
    return blocks.join('\n\n---\n\n');
}