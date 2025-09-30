// app/(ruta)/chats/page.tsx
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";

import { ChatMain } from "./_components/chat-main";
import { ChatSidebar } from "./_components/chat-sidebar";

import { getInstancesByUserId } from "@/actions/instances-actions";
import { fetchChatsFromEvolution } from "@/actions/chat-actions";
import { getApiKeyById } from "@/actions/api-action";
import type { ApiKey, Instancias } from "@prisma/client";

/* ---------- Tipos mínimos (de la respuesta que usa el hijo) ---------- */
type LastMessage = {
  message?: { conversation?: string };
  messageTimestamp?: number;
  messageType?: string;
};
type ChatData = {
  remoteJid: string;
  pushName: string | null;
  profilePicUrl: string | null;
  lastMessage: LastMessage | null;
  unreadCount: number;
};
export type FetchChatsResult =
  | { success: true; message: string; data: ChatData[] }
  | { success: false; message: string };

/* ---------- Utils ---------- */
function pickWhatsappOrNull(arr: Instancias[]) {
  return (
    arr.find((i) => i.tipoInstancia === "Whatsapp") ??
    arr.find((i) => i.tipoInstancia == null) ??
    null
  );
}
function hasInstancias(result: { data?: Instancias[] | null }): result is { data: Instancias[] } {
  return Array.isArray(result.data) && result.data.length > 0;
}
function hasApikey(result: { data?: ApiKey | null }): result is { data: ApiKey } {
  return !!result.data;
}

/* ---------- Página ---------- */
export default async function ChatsPage() {
  const user = await currentUser();
  if (!user) redirect("/login");

  const [resInstancias, resApikey] = await Promise.all([
    getInstancesByUserId(user.id),
    getApiKeyById(user.apiKeyId),
  ]);

  const instancias = hasInstancias(resInstancias) ? resInstancias.data : [];
  const whatsappInstancia = pickWhatsappOrNull(instancias);
  const apiKey = hasApikey(resApikey) ? resApikey.data : null;

  let chatsResult: FetchChatsResult;
  if (whatsappInstancia && apiKey) {
    chatsResult = await fetchChatsFromEvolution(apiKey, whatsappInstancia.instanceName);
  } else {
    chatsResult = {
      success: false,
      message: !apiKey
        ? "No hay API Key configurada."
        : "No se encontró una instancia 'Whatsapp' ni instancia nula.",
    };
  }

  return (
    <div className="flex h-full">
      <ChatSidebar result={chatsResult} />
      <ChatMain />
    </div>
  );
}
