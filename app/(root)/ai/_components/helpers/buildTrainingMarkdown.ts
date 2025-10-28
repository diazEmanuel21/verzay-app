import { TrainingDraftSchema } from "@/types/agentAi";
import { nonEmpty } from "./nonEmpty";
import z from "zod";

export function buildTrainingMarkdown(training: z.infer<typeof TrainingDraftSchema>): string {
    const stepBlocks = (training.steps ?? []).map((s, idx) => {
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
                        body.push(`> función: captura_datos\n${nonEmpty(fn.prompt) || ''}\nCampos: ${(fn.fields || []).join(', ')}`);
                        break;
                    case 'ejecutar_flujo':
                        body.push(`> función: Ejecuta el flujo '${fn.flowName || fn.flowId || ''}'`);
                        body.push(`* **Comportamiento:** Después de ejecutar el flujo, tu única respuesta debe ser la que se te indique.`);
                        break;
                    case 'notificar_asesor':
                        body.push(`> función: notificar_asesor\nDestino: ${fn.notificationNumber || ''}`);
                        break;
                    case 'consulta_datos':
                        body.push(`> función: consulta_datos\n${nonEmpty(fn.prompt) || ''}`);
                        break;
                }
            }
        }
        return [head, ...body.filter(Boolean)].join('\n\n');
    });

    return stepBlocks.filter(Boolean).join('\n\n---\n\n');
}