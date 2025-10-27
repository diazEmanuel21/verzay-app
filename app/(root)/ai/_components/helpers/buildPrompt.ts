import { BusinessValues } from "@/types/agentAi";
import { addPromptItem as add } from "./";

export const buildPrompt = (v: BusinessValues): string => {
    const lines: string[] = [];

    // if (!v.nombre?.trim()) {
    //     return `Completa al menos el nombre del negocio para generar el prompt.`;
    // }

    lines.push(`## DATOS DEL NEGOCIO`);
    lines.push(`* **Nombre:** ${v.nombre.trim()}`);

    add(lines, "* **Sector/Rubro:**", v.sector);
    add(lines, "* **Ubicación/Dirección:**", v.ubicacion);
    add(lines, "* **Horarios de atención:**", v.horarios);
    add(lines, "* **Google Maps:**", v.maps);
    add(lines, "* **Número de contacto:**", v.telefono);
    add(lines, "* **Correo electrónico:**", v.email);
    add(lines, "* **Sitio web:**", v.sitio);
    add(lines, "* **Facebook:**", v.facebook);
    add(lines, "* **Instagram:**", v.instagram);
    add(lines, "* **TikTok:**", v.tiktok);
    add(lines, "* **YouTube:**", v.youtube);

    if (v.notas?.trim()) {
        lines.push("\n### NOTAS ADICIONALES");
        lines.push(v.notas.trim());
    }

    lines.push(
        `\n## INSTRUCCIÓN
Eres responsable de gestionar, por WhatsApp, toda la información y requerimientos de esta empresa. Responde de forma clara, concisa y accionable usando **exclusivamente** la información de este documento. Si falta un dato, continúa con naturalidad **sin inventarlo**. **Cumple estas instrucciones de manera literal.**

* Usa **solo** la información disponible; **no inventes** nada.
* **Sigue el orden fijo**: 1) Detecta intención → 2) Ejecuta el flujo indicado → 3) Cumple la **poscondición**.
* Si un flujo devuelve mensaje: **reenvíalo literal** como **única respuesta** (sin añadir texto).
* Si no hay orden clara al enviar un flujo: **haz 1 pregunta contextual mínima** para avanzar hacia la conversión.
* **No mezcles ni saltes** pasos o flujos y responde con **una sola intervención por turno**, breve, clara y accionable.

* Mantén *una sola regla operativa única* (compacta):
* *Cuando veas “Ejecuta el Flujo: X”, ejecútalo y **reenvía su salida literal**; si no hay instrucción clara, haz **1** pregunta contextual mínima.*
* El **checklist** es opcional; ayuda a reducir desvíos en sesiones largas, pero es redundante con tus reglas.`
    );

    if (v.training?.trim()) {
        lines.push("\n## PROCEDIMIENTO OBLIGATORIO (CHATS SIN HISTORIAL)");
        lines.push(v.training.trim());
    }

    if (v.faq?.trim()) {
        lines.push("\n## PREGUNTAS & RESPUESTAS");
        lines.push(v.faq.trim());
    }

    if (v.products?.trim()) {
        lines.push("\n## CATÁLOGO / PRODUCTOS");
        lines.push(v.products.trim());
    }

    if (v.more?.trim()) {
        lines.push("\n## EXTRAS");
        lines.push(v.more.trim());
    }

    return lines.join("\n");
}