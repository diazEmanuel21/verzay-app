// /lib/promptBuilder.ts

import { flowBehaviorText as initialFlowBehaviorText, notifyPrompt } from "@/types/agentAi";

export type AnyEl = {
    kind: "text" | "function";
    text?: string;
    fn?: "captura_datos" | "ejecutar_flujo" | "notificar_asesor" | "consulta_datos" | "actualizar_datos";
    subtype?: string;
    prompt?: string;
    fields?: string[];
    flowName?: string;
    flowId?: string;
    notificationNumber?: string;
};

export type AnyStep = {
    title?: string;
    mainMessage?: string;
    elements?: AnyEl[];
};

export type FirmaOpts = {
    enabled: boolean;
    text: string;
};

export type PromptBuildConfig = {
    /** Mensaje cuando no hay items */
    emptyMessage: string;
    /** Texto del encabezado por sección (recibe índice base 1) */
    sectionLabel: (n: number, step: AnyStep) => string;
    /** Texto del bloque de elementos (recibe índice base 1) */
    elementsLabel: (n: number) => string;
    /** Etiqueta del mensaje principal */
    mainMessageLabel: string;
    /** Texto para la explicación de ejecutar_flujo */
    flowBehaviorText?: string; // default: "Después de ejecutar el flujo, tu única respuesta es la indicada en **Regla/parámetro**."
    /** Separador entre bloques finales */
    joinSeparator?: string; // default: "\n"
    /** Opción para anteponer firma */
    firma?: FirmaOpts;
    appointmentUrl?: string;
};
const transformSubtype = (subtype?: string): string | undefined => {
    const transformMap: Record<string, string> = {
        "Solicitudes": "solicitud",
        "Reclamos": "reclamo",
        "Pedidos": "pedido",
        "Reservas": "reserva",
        "Citas": "cita"
    };
    return subtype ? transformMap[subtype] : undefined;
};

function trimOrUndefined(s?: string) {
    const t = (s ?? "").trim();
    return t.length ? t : undefined;
}

function formatElement(
    el: AnyEl,
    k: number,
    flowBehaviorText: string,
    appointmentUrl?: string
): string[] {
    const out: string[] = [];

    if (el.kind === "text") {
        const t = trimOrUndefined(el.text);
        if (t) out.push(`- (${k}) **Regla/parámetro:** ${t}`);
        return out;
    }

    if (el.kind === "function") {
        switch (el.fn) {
            case "captura_datos": {
                const newSubtype = transformSubtype(el.subtype);

                // 🔸 CASO ESPECIAL: CITA
                if (newSubtype === "cita") {
                    const url = appointmentUrl?.trim()
                        ? `${appointmentUrl}`
                        : "<https://enlace/agenda>"; // fallback por si no hay URL

                    out.push(
                        [
                            "Cuando un usuario desee agendar una **cita** envía de forma literal los siguientes mensajes:",
                            "",
                            "🗓 Puedes agendar tu cita en nuestro calendario.",
                            "",
                            `👉 ${url}`,
                        ].join("\n")
                    );

                    return out;
                }

                // 🔸 RESTO DE SUBTIPOS (solicitud, reclamo, pedido, reserva…)
                const base = `\n### Captura de datos\n**(${k}) Toma de ${newSubtype ?? ""}**\n- (${k}) Para procesar tu *${newSubtype ?? "—"}*, ${el.prompt ?? ""}:`;
                out.push(base);

                if (el.fields?.length) {
                    out.push(`${el.fields.join("\n")}`);
                }
                return out;
            }

            case "actualizar_datos": {
                const newSubtype = transformSubtype(el.subtype);
                const base = `\n### Actualizar datos\n**(${k}) Toma de ${newSubtype ?? ""}**\n- (${k}) Para procesar tu *${newSubtype ?? "—"}*, ${el.prompt ?? ""}:`;
                out.push(base);
                if (el.fields?.length) {
                    out.push(`${el.fields.join("\n")}`);
                }
                return out;
            }

            case "ejecutar_flujo": {
                out.push(
                    `> **Función**: Ejecuta el flujo '${el.flowName || el.flowId || ""}'`,
                );
                out.push(`${flowBehaviorText}`);
                return out;
            }
            case "notificar_asesor": {
                out.push(`- (${k}) ${notifyPrompt}`);
                return out;
            }
            case "consulta_datos": {
                const newSubtype = transformSubtype(el.subtype);
                const base = `\n### Consulta de datos\n**(${k}) Toma de ${newSubtype ?? ""}**\n- (${k}) Para procesar tu *${newSubtype ?? "—"}*, ${el.prompt ?? ""}:`;
                out.push(base);
                if (el.fields?.length) {
                    out.push(`${el.fields.join("\n")}`);
                }
                return out;
            }
            default:
                return out;
        }
    }

    return out;
}


/**
 * Construye un prompt con estructura homogénea para Items/Pasos.
 */
export function buildSectionedPrompt(
    items: AnyStep[],
    cfg: PromptBuildConfig
): string {
    const blocks: string[] = [];
    const joinSep = cfg.joinSeparator ?? "\n";
    const flowBehaviorText =
        cfg.flowBehaviorText ?? initialFlowBehaviorText;
    // Firma (opcional, solo se añade si está habilitada y hay texto)
    if (cfg.firma?.enabled) {
        const ft = trimOrUndefined(cfg.firma.text);
        if (ft) blocks.push(ft);
    }

    // Empty
    if (!items || items.length === 0) {
        blocks.push(cfg.emptyMessage);
        return blocks.join(joinSep);
    }

    // Contenido
    items.forEach((step, i) => {
        const n = i + 1;

        // Título de sección
        blocks.push(`\n${cfg.sectionLabel(n, step)}`);

        // Mensaje principal
        const main = trimOrUndefined(step.mainMessage);
        if (main) {
            blocks.push(`* **${cfg.mainMessageLabel}:**${main}`);
        }

        // Elementos
        const els = Array.isArray(step.elements) ? step.elements : [];
        if (els.length > 0) {
            // blocks.push(`\n#### ${cfg.elementsLabel(n)}`);
            blocks.push(`${cfg.elementsLabel(n)}`);
            els.forEach((el, idx) => {
                const k = idx + 1;
                blocks.push(...formatElement(el, k, flowBehaviorText, cfg.appointmentUrl));
            });

            // Aquí añadimos el separador "---"
            blocks.push('\n---'); // El separador debajo de cada bloque de elementos
        }
    });

    return blocks.join(joinSep);
}