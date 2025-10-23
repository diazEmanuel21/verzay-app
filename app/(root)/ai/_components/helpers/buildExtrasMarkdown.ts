import z from "zod";
import { nonEmpty } from "./nonEmpty";
import { ExtrasDraftSchema } from "@/types/agentAi";

export function buildExtrasMarkdown(extras: z.infer<typeof ExtrasDraftSchema>): string {
    const parts: string[] = [];
    if (extras.firmaEnabled) parts.push(nonEmpty(extras.firmaText) || '');
    const blocks = (extras.items ?? [])
        .filter((e) => nonEmpty(e.title) || nonEmpty(e.content))
        .map(
            (e) =>
                `### Campo: ${nonEmpty(e.title) || '(Sin título)'}\n*Contenido:*\n${nonEmpty(e.content) || '(Sin contenido)'}`
        );
    if (blocks.length) parts.push(blocks.join('\n\n---\n\n'));
    return parts.filter(Boolean).join('\n\n---\n\n');
}
