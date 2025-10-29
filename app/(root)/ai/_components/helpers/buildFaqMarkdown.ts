import z from "zod";
import { nonEmpty } from "./nonEmpty";
import { FaqDraftSchema } from "@/types/agentAi";

export function buildFaqMarkdown(faq: z.infer<typeof FaqDraftSchema>): string {
    const stepBlocks = (faq.steps ?? []).map((s, idx) => {
        const head = `### Paso ${idx + 1}${nonEmpty(s.title) ? `: ${s.title}` : ''}`;
        const body: string[] = [];
        if (nonEmpty(s.mainMessage)) body.push(s.mainMessage!);
        for (const el of s.elements ?? []) {
            if ((el as any).kind === 'text') {
                body.push((el as any).text ?? '');
            } else {

                const fn = el as any;
                switch (fn.fn) {
                    case 'captura_datos':
                        body.push(`> Función: captura_datos\n${nonEmpty(fn.prompt) || ''}\nCampos: ${(fn.fields || []).join(', ')}`);
                        break;
                    case 'ejecutar_flujo':
                        body.push(`> Función: Ejecuta el flujo '${fn.flowName || fn.flowId || ''}'`);
                        body.push(`* **Comportamiento:** Después de ejecutar el flujo, tu única respuesta es la que se te indique en **Regla/parámetro**.`);
                        break;
                    case 'notificar_asesor':
                        body.push(`> Función: notificar_asesor\nDestino: ${fn.notificationNumber || ''}`);
                        break;
                    case 'consulta_datos':
                        body.push(`> Función: consulta_datos\n${nonEmpty(fn.prompt) || ''}`);
                        break;
                }
            }
        }
        return [head, ...body.filter(Boolean)].join('\n\n');
    });

    return stepBlocks.filter(Boolean).join('\n\n---\n\n');
}