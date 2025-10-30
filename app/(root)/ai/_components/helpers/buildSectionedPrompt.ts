// /lib/promptBuilder.ts

export type AnyEl = {
    kind: "text" | "function";
    text?: string;
    fn?: "captura_datos" | "ejecutar_flujo" | "notificar_asesor" | "consulta_datos";
    // Campos comunes que se usan en tu código actual
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
};

function trimOrUndefined(s?: string) {
    const t = (s ?? "").trim();
    return t.length ? t : undefined;
}

function formatElement(el: AnyEl, k: number, flowBehaviorText: string): string[] {
    const out: string[] = [];

    if (el.kind === "text") {
        const t = trimOrUndefined(el.text);
        if (t) out.push(`- (${k}) **Regla/parámetro:** ${t}`);
        return out;
    }

    if (el.kind === "function") {
        switch (el.fn) {
            case "captura_datos": {
                const base = `- (${k}) Captura de datos — ${el.subtype ?? "—"}: ${el.prompt ?? ""}`;
                out.push(base);
                if (el.subtype === "Pedidos" && el.fields?.length) {
                    out.push(`  Campos: ${el.fields.join(", ")}`);
                }
                return out;
            }
            case "ejecutar_flujo": {
                out.push(
                    `> Función: Ejecuta el flujo '${el.flowName || el.flowId || ""}'`,
                );
                out.push(`* **Comportamiento:** ${flowBehaviorText}`);
                return out;
            }
            case "notificar_asesor": {
                // out.push(`- (${k}) Notificar asesor: ${el.notificationNumber ?? "—"}`);
                out.push(`- (${k}) > Función: Ejecuta la tool 'Notificacion Asesor'\n* **Comportamiento:** Después de ejecutar la tool, tu única respuesta es la que se te indique en **Regla/parámetro**.`);
                return out;
            }
            case "consulta_datos": {
                out.push(`- (${k}) Consulta de datos:\n${el.prompt ?? ""}`);
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
        cfg.flowBehaviorText ??
        "Después de ejecutar el flujo, tu única respuesta es la indicada en **Regla/parámetro**.";

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
        blocks.push(`\n### ${cfg.sectionLabel(n, step)}`);

        // Mensaje principal
        const main = trimOrUndefined(step.mainMessage);
        if (main) {
            blocks.push(`* **${cfg.mainMessageLabel}:**\n${main}`);
        }

        // Elementos
        const els = Array.isArray(step.elements) ? step.elements : [];
        if (els.length > 0) {
            blocks.push(`\n#### ${cfg.elementsLabel(n)}`);
            els.forEach((el, idx) => {
                const k = idx + 1;
                blocks.push(...formatElement(el, k, flowBehaviorText));
            });
        }
    });

    return blocks.join(joinSep);
}
