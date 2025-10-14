import { ProductsDraftSchema } from "@/types/agentAi";
import { nonEmpty } from "./nonEmpty";
import z from "zod";

export function buildProductsMarkdown(products: z.infer<typeof ProductsDraftSchema>): string {
    const blocks = (products.items ?? [])
        .filter((p) => nonEmpty(p.name) || nonEmpty(p.description))
        .map(
            (p) =>
                `## Producto: ${nonEmpty(p.name) || '(Sin nombre)'}\n*Descripción:*\n${nonEmpty(p.description) || '(Sin descripción)'}`
        );
    return blocks.join('\n\n---\n\n');
}