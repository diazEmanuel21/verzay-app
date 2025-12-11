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
    elementsLabel: (n: number, step: AnyStep) => string;
    /** Etiqueta del mensaje principal */
    mainMessageLabel: string;
    /** Texto para la explicación de ejecutar_flujo */
    flowBehaviorText?: string; // default: "Después de ejecutar el flujo, tu única respuesta es la indicada en **Regla/parámetro**."
    /** Separador entre bloques finales */
    joinSeparator?: string; // default: "\n"
    /** Opción para anteponer firma */
    firma?: FirmaOpts;
    appointmentUrl?: string;

    // 🔹 NUEVO: modo especial solo para ManagementBuilder
    mode?: "default" | "management";
};

export const transformSubtype = (subtype?: string): string | undefined => {
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
    cfg: PromptBuildConfig
): string[] {
    const out: string[] = [];

    if (el.kind === "text") {
        const t = trimOrUndefined(el.text);
        if (t) out.push(`- (${k}) **Regla/parámetro:** ${t}\n`);
        return out;
    }

    if (el.kind === "function") {
        switch (el.fn) {
            case "captura_datos": {
                const newSubtype = transformSubtype(el.subtype);

                // 🔸 CASO ESPECIAL: CITA (igual que antes)
                if (newSubtype === "cita") {
                    const url = cfg.appointmentUrl?.trim()
                        ? `${cfg.appointmentUrl}`
                        : "<https://enlace/agenda>"; // fallback por si no hay URL

                    out.push(
                        [
                            `**(${k}) Toma de cita**`,
                            `- (${k}) 🗓 Puedes agendar tu cita en nuestro calendario.\n`,
                            `👉 ${url}\n`,
                            "* **Comportamiento obligatorio:** Tras enviar el link de la agenda, responde **únicamente** lo indicado en **Regla/parámetro**. Si **no hay una orden clara**, adapta una **respuesta contextual** para guiar al usuario al siguiente paso lógico de la conversación. **No añadas texto innecesario.**\n",
                        ].join("\n")
                    );

                    return out;
                }

                // 🔹 MAPA PARA ARTÍCULO Y TEXTO (solicitud, pedido, reserva, reclamo)
                const generoMap: Record<string, { articulo: string; label: string }> = {
                    solicitud: { articulo: "la", label: "solicitud" },
                    reserva: { articulo: "la", label: "reserva" },
                    cita: { articulo: "la", label: "cita" },
                    pedido: { articulo: "el", label: "pedido" },
                    reclamo: { articulo: "el", label: "reclamo" },
                };

                const info = newSubtype
                    ? generoMap[newSubtype] ?? { articulo: "la", label: newSubtype }
                    : { articulo: "la", label: "gestión" };

                // 🔹 FORMATO ESPECIAL SOLO PARA MANAGEMENT
                if (cfg.mode === "management") {
                    const datosBlock = el.fields?.length
                        ? el.fields.map((f) => `* ${f}`).join("\n")
                        : "* **`Datos`** (escritos por el cliente)";

                    out.push(
                        [
                            `**(${k}) Toma de ${info.label}**`,
                            `- (${k}) Para procesar tu *${info.label}*, ${el.prompt ?? "por favor indícame los siguientes datos:"}`,
                            datosBlock,
                            "",
                            `* **Comportamiento obligatorio:** Tras guardar los datos de ${info.articulo} ${info.label}. Ejecuta la **tool**: \`Notificacion Asesor\` y responde **únicamente** lo indicado en **Regla/parámetro**.`,
                            `  Si **no hay una orden clara**, envia el siguiente **mensaje de confirmacion** al usuario:`,
                            `> 📝 ¡He **registrado** tu **${info.label}**! 👨🏻‍💻 Un asesor se pondrá en contacto a la brevedad posible. ⏰\n`,
                        ].join("\n")
                    );

                    return out;
                }

                // 🔹 FORMATO GENERAL (NO MANAGEMENT) — tal como lo tenías
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
                out.push(`- (${k}) **Función**: Ejecuta el flujo '${el.flowName || el.flowId || ""}'`);
                out.push(`${flowBehaviorText}\n`);
                return out;
            }
            case "notificar_asesor": {
                out.push(`- (${k}) ${notifyPrompt}\n`);
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
            // 🔹 Comportamiento especial SOLO para Management
            if (cfg.mode === "management") {
                // 1) Línea del objetivo
                blocks.push(`* **${cfg.mainMessageLabel}** \n${main}\n`);

                // 2) Línea "Cuando un usuario desee realizar una/un ..."
                const captura = (step.elements || []).find(
                    (el: AnyEl) => el.kind === "function" && el.fn === "captura_datos"
                ) as AnyEl | undefined;

                const rawSubtype = captura?.subtype ?? "";
                const newSubtype = transformSubtype(rawSubtype);

                if (newSubtype) {
                    const generoMap: Record<string, { articulo: string; label: string }> = {
                        solicitud: { articulo: "una", label: "solicitud" },
                        reserva: { articulo: "una", label: "reserva" },
                        cita: { articulo: "una", label: "cita" },
                        pedido: { articulo: "un", label: "pedido" },
                        reclamo: { articulo: "un", label: "reclamo" },
                    };

                    const info =
                        generoMap[newSubtype] ?? { articulo: "una", label: newSubtype };

                    blocks.push(
                        `Cuando un usuario desee realizar ${info.articulo} **${info.label}**`
                    );
                }
            } else {
                blocks.push(`* **${cfg.mainMessageLabel}** \n${main}\n`);
            }
        }
        // Elementos
        const els = Array.isArray(step.elements) ? step.elements : [];
        if (els.length > 0) {
            // blocks.push(`\n#### ${cfg.elementsLabel(n)}`);
            blocks.push(`${cfg.elementsLabel(n, step)}`);
            els.forEach((el, idx) => {
                const k = idx + 1;
                blocks.push(...formatElement(el, k, flowBehaviorText, cfg));
            });

            // Aquí añadimos el separador "---"
            blocks.push('\n---'); // El separador debajo de cada bloque de elementos
        }
    });

    return blocks.join(joinSep);
}