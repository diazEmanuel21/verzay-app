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
Debes **adherirte a estos pasos de conversación (Usuario ⇄ IA)** para **seguir estrictamente** los pasos provistos para este negocio específico, **sin saltar ni mezclar** pasos, respetando **funciones**, **salidas literales** y **comportamientos**. ## Parámetros de entrada (completa quien invoca) * **[Contexto breve]:** '[escenario / canal / notas]' * **[Flujo/Pasos]:** bloque con pasos **numerados** y sus reglas (incluye funciones, salidas literales, comportamientos, validaciones, fallbacks) * **[Variables requeridas]:** '[lista de variables esperadas: nombre, ciudad, producto, etc.]' * **{características}:** estilo **profesional**, tono **neutral**, ejemplo **breve y accionable** usando **exclusivamente** la información de este documento. Si falta un dato, continúa con naturalidad **sin inventarlo**. 
`);

    if (v.training?.trim()) {
        lines.push("## PROCEDIMIENTO OBLIGATORIO (CHATS SIN HISTORIAL)\n");
        lines.push(v.training.trim());
    }

    if (v.faq?.trim()) {
        lines.push("\n## PREGUNTAS & RESPUESTAS\n");
        lines.push(v.faq.trim());
    }

    if (v.products?.trim()) {
        lines.push("\n## CATÁLOGO / PRODUCTOS\n");
        lines.push(v.products.trim());
    }

    if (v.more?.trim()) {
        lines.push("\n## EXTRAS\n");
        lines.push(v.more.trim());
    }

    return lines.join("\n");
}