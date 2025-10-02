export const dynamic = "force-dynamic";
export const revalidate = 0;

import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";

import { getInstancesByUserId } from "@/actions/instances-actions";
import { fetchChatsFromEvolution, findMessagesByRemoteJid, FetchChatsResult, EvolutionMessage } from "@/actions/chat-actions"; 
// Asegúrate de que FetchChatsResult, EvolutionMessage y cualquier otro tipo que uses en la página,
// se exporte desde "@/actions/chat-actions" y se importe aquí.
import { getApiKeyById } from "@/actions/api-action";
import type { ApiKey, Instancias } from "@prisma/client";
import { ChatsClient } from "./_components/chats-client";

/* ---------- Tipos mínimos ---------- */

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
  // ✅ REEMPLAZO DE .bind() CON CLAUSURA DIRECTA Y 'USE SERVER'
  // ----------------------------------------------------

  // Definimos la Server Action parcial aquí, usando las variables del scope
  const warmMessages =
    whatsappInstancia && apiKey
      ? async (
        // Estos son los argumentos que el cliente pasará
        remoteJid: string,
        options?: { page?: number; pageSize?: number }
      ) => {
        // 🛑 CORRECCIÓN: Se añade la directiva 'use server'
        'use server';

        // Las variables 'apiKey' y 'whatsappInstancia' están cerradas (clausura)
        return findMessagesByRemoteJid(
          { url: apiKey!.url, key: apiKey!.key },
          whatsappInstancia!.instanceName,
          remoteJid,
          options
        );
      }
      : undefined;

  return (
    <ChatsClient
      chatsResult={chatsResult}
      initialSelectedJid={initialSelectedJid}
      initialMessages={initialMessages}
      warmMessages={warmMessages}
      instanceName={whatsappInstancia?.instanceName}
    />
  );
}