"use server";

import { AppContextSnapshot, ChatMessage } from "@/types/ai-assistence-chat";
import { ActionResult, resolveUserAiClient } from "./userAiconfig-actions";
import { currentUser } from "@/lib/auth";
import { toAiMessages } from "@/app/(root)/ai-chat/helpers/toAiMessages";
import { createAiClient } from "@/app/(root)/ai-chat/helpers/createAiClient";

export type ChatRequest = {
    messages: ChatMessage[];
    context: AppContextSnapshot;
};

export type ChatResponse = {
    message: ChatMessage;
    suggestions?: string[];
};

function buildSystemPrompt(ctx: AppContextSnapshot) {
    return `
Eres un asistente de soporte interno para una app (Next.js + Shadcn + CRM).
REGLAS:
- Prioriza el contexto actual (ruta/params/search).
- Puedes guiar a otras pantallas si es mejor.
- No inventes pantallas/botones/campos.
- Si falta info: pide 1 dato puntual.
- Formato obligatorio:
  1) Respuesta breve (1-2 líneas)
  2) Pasos numerados
  3) Ruta sugerida: Ruta: /xxx/yyy
  4) Nota de verificación (si aplica)

CONTEXTO:
pathname: ${ctx.pathname}
params: ${JSON.stringify(ctx.params)}
search: ${JSON.stringify(ctx.search)}
`.trim();
}

export async function sendChatAction(req: ChatRequest): Promise<ActionResult<ChatResponse>> {
    try {
        const user = await currentUser();
        if (!user?.id) return { success: false, message: "auth_required" };

        const resolved = await resolveUserAiClient(user.id);
        if (!resolved.success || !resolved.data) return resolved as any;

        const { provider, model, apiKey } = resolved.data;

        const ai = createAiClient(provider);
        const system = buildSystemPrompt(req.context);
        const msgs = toAiMessages(req.messages);

        const result = await ai.complete({
            apiKey,
            model,
            system,
            messages: msgs,
        });

        const content =
            (result.content || "").trim() ||
            "No pude generar una respuesta. ¿Puedes reformular tu pregunta?";

        return {
            success: true,
            message: "ok",
            data: {
                message: {
                    id: crypto.randomUUID(),
                    role: "assistant",
                    content,
                    createdAt: Date.now(),
                },
            },
        };
    } catch (e) {
        return { success: false, message: "chat_action_error" };
    }
}