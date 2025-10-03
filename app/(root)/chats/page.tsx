export const dynamic = "force-dynamic";
export const revalidate = 0;

import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";

import { getInstancesByUserId } from "@/actions/instances-actions";
import {
  fetchChatsFromEvolution,
  findMessagesByRemoteJid,
  sendTextMessage,
  FetchChatsResult,
  EvolutionMessage,
  SendMessageResult
} from "@/actions/chat-actions";

import { getApiKeyById } from "@/actions/api-action";
import type { ApiKey, Instancias } from "@prisma/client";
import { ChatsClient } from "./_components/chats-client";

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
export default async function ChatsPage({ searchParams }: { searchParams?: { jid?: string } }) {
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

  // JID inicial (por URL o primero)
  const initialSelectedJid =
    chatsResult.success && searchParams?.jid
      ? searchParams.jid
      : chatsResult.success && chatsResult.data.length > 0
        ? chatsResult.data[0].remoteJid
        : "";

  // Precarga inicial de mensajes
  let initialMessages: EvolutionMessage[] = [];
  if (chatsResult.success && initialSelectedJid && whatsappInstancia && apiKey) {
    const msgsRes = await findMessagesByRemoteJid(
      { url: apiKey.url, key: apiKey.key },
      whatsappInstancia.instanceName,
      initialSelectedJid,
      { page: 1, pageSize: 50 }
    );

    if (msgsRes.success) {
      initialMessages = msgsRes.data || [];
    }
  }

  // ----------------------------------------------------
  // ✅ CREACIÓN DE CLAUSURAS DE SERVER ACTIONS
  // ----------------------------------------------------

  // 1. Clausura para obtener mensajes (Usada por `warmMessages` en ChatsClient)
  const warmMessages =
    whatsappInstancia && apiKey
      ? async (
        remoteJid: string,
        options?: { page?: number; pageSize?: number }
      ) => {
        'use server';

        return findMessagesByRemoteJid(
          { url: apiKey!.url, key: apiKey!.key },
          whatsappInstancia!.instanceName,
          remoteJid,
          options
        );
      }
      : undefined;

  // 2. Clausura para enviar mensajes de texto (Usada por `sendText` en ChatsClient)
  const handleSendTextAction =
    whatsappInstancia && apiKey
      ? async (
        remoteJid: string,
        textMessage: string
      ) => {
        'use server';

        return sendTextMessage(
          { url: apiKey!.url, key: apiKey!.key },
          whatsappInstancia!.instanceName,
          remoteJid,
          textMessage,
          {}
        );
      }
      : async (remoteJid: string, textMessage: string): Promise<SendMessageResult> => ({ // <-- CORREGIDO AQUÍ
        success: false,
        message: "No hay instancia o API key configurada para enviar mensajes.",
        remoteJid,
      });

  // 3. Clausura para obtener la lista de chats actualizada (Usada por `refetchChats` en ChatsClient)
  const refetchChatsAction =
    whatsappInstancia && apiKey
      ? async (): Promise<FetchChatsResult> => {
        'use server';
        return fetchChatsFromEvolution(
          { url: apiKey!.url, key: apiKey!.key },
          whatsappInstancia!.instanceName
        );
      }
      : async (): Promise<FetchChatsResult> => ({
        success: false,
        message: "No hay instancia o API key configurada para refrescar chats.",
      });


  return (
    <ChatsClient
      chatsResult={chatsResult}
      initialSelectedJid={initialSelectedJid}
      initialMessages={initialMessages}
      warmMessages={warmMessages}
      sendText={handleSendTextAction}
      refetchChats={refetchChatsAction}
      instanceName={whatsappInstancia?.instanceName}
    />
  );
}