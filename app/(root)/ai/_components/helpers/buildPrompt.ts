import { BusinessValues } from "@/types/agentAi";
import { addPromptItem as add } from "./";

export const buildPrompt = (v: BusinessValues): string => {
    const lines: string[] = [];

    if (!v.nombre?.trim()) {
        return `Completa al menos el nombre del negocio para generar el prompt.`;
    }

    lines.push(`# 🎯 PERFIL DEL NEGOCIO`);
    lines.push(`Nombre: ${v.nombre.trim()}`);

    add(lines, "Sector/Rubro", v.sector);
    add(lines, "Ubicación/Dirección", v.ubicacion);
    add(lines, "Horarios de atención", v.horarios);
    add(lines, "Google Maps", v.maps);
    add(lines, "Número de contacto", v.telefono);
    add(lines, "Correo electrónico", v.email);
    add(lines, "Sitio web", v.sitio);
    add(lines, "Facebook", v.facebook);
    add(lines, "Instagram", v.instagram);
    add(lines, "TikTok", v.tiktok);
    add(lines, "YouTube", v.youtube);

    if (v.notas?.trim()) {
        lines.push("\n## Notas adicionales");
        lines.push(v.notas.trim());
    }

    lines.push(
        "\n## Instrucción\nActúa como asistente encargado de gestionar información y pedidos por WhatsApp. Construye respuestas claras, concisas y accionables usando solo los datos suministrados arriba. Si algún dato falta, continúa con naturalidad sin inventarlo."
    );

    if (v.training?.trim()) {
        lines.push("\n## Entrenamiento");
        lines.push(v.training.trim());
    }

    if (v.faq?.trim()) {
        lines.push("\n## Preguntas & Respuestas");
        lines.push(v.faq.trim());
    }

    if (v.products?.trim()) {
        lines.push("\n## Catálogo / Productos");
        lines.push(v.products.trim());
    }

    return lines.join("\n");
}