export const dynamic = "force-dynamic";
export const revalidate = 0;

import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { getInstancesByUserId } from "@/actions/instances-actions";
import {
  fetchChatsFromEvolution,
  findMessagesByRemoteJid,
  sendTextMessage,
  sendMediaByUrl, // asegúrate de exportarla en tu action
  type FetchChatsResult,
  type EvolutionMessage as EvoMsgFromAction,
  type SendMessageResult,
} from "@/actions/chat-actions";
import { getApiKeyById } from "@/actions/api-action";
import type { ApiKey, Instancia } from "@prisma/client";
import { ChatsClient } from "./_components/chats-client";
import { buildChatHistorySessionId } from "@/lib/chat-history/build-session-id";
import { saveChatHistoryMessage } from "@/lib/chat-history/chat-history.helper";

// Tipos importados desde ChatMain (cliente)
import type { OutgoingMessagePayload } from "./_components/chat-main";
import { listTagsAction } from "@/actions/tag-actions";

/* ---------- Utils ---------- */
function pickWhatsappOrNull(arr: Instancia[]) {
  return (
    arr.find((i) => i.instanceType === "Whatsapp") ??
    arr.find((i) => i.instanceType == null) ??
    null
  );
}
function hasInstancias(
  result: { data?: Instancia[] | null }
): result is { data: Instancia[] } {
  return Array.isArray(result.data) && result.data.length > 0;
}
function hasApikey(result: { data?: ApiKey | null }): result is { data: ApiKey } {
  return !!result.data;
}

function buildOutgoingHistoryEntry(payload: OutgoingMessagePayload) {
  if (payload.kind === "text") {
    return {
      content: payload.text.trim(),
      additionalKwargs: {
        messageKind: "text",
      },
    };
  }

  const mediaLabel =
    payload.mediatype === "image"
      ? "[Imagen]"
      : payload.mediatype === "video"
        ? "[Video]"
        : payload.mediatype === "audio"
          ? payload.ptt
            ? "[Nota de voz]"
            : "[Audio]"
          : "[Documento]";

  const fileName = payload.fileName?.trim();
  const caption = payload.caption?.trim();
  const content = [fileName ? `${mediaLabel} ${fileName}` : mediaLabel, caption]
    .filter(Boolean)
    .join("\n");

  return {
    content,
    additionalKwargs: {
      messageKind: "media",
      mediatype: payload.mediatype,
      fileName: fileName || null,
      mimetype: payload.mimetype || null,
      hasCaption: Boolean(caption),
      ptt: payload.ptt ?? false,
    },
  };
}

export default async function ChatsPage({
  searchParams,
}: {
  searchParams?: { jid?: string };
}) {
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

  const initialSelectedJid =
    chatsResult.success && searchParams?.jid
      ? searchParams.jid
      : chatsResult.success && chatsResult.data.length > 0
        ? chatsResult.data[0].remoteJid
        : "";

  // Precarga inicial de mensajes
  let initialMessages: EvoMsgFromAction[] = [];
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

  // --------- Clausuras de Server Actions ---------

  // 1) Carga mensajes por JID (para ChatsClient)
  const warmMessages =
    whatsappInstancia && apiKey
      ? async (
        remoteJid: string,
        options?: { page?: number; pageSize?: number }
      ) => {
        "use server";
        return findMessagesByRemoteJid(
          { url: apiKey!.url, key: apiKey!.key },
          whatsappInstancia!.instanceName,
          remoteJid,
          options
        );
      }
      : undefined;

  // 2) Refrescar lista de chats
  const refetchChatsAction =
    whatsappInstancia && apiKey
      ? async (): Promise<FetchChatsResult> => {
        "use server";
        return fetchChatsFromEvolution(
          { url: apiKey!.url, key: apiKey!.key },
          whatsappInstancia!.instanceName
        );
      }
      : async (): Promise<FetchChatsResult> => ({
        success: false,
        message: "No hay instancia o API key configurada para refrescar chats.",
      });

  // 3) Callback unificado para enviar cualquier formato
  const sendAnyAction =
    whatsappInstancia && apiKey
      ? async (
        remoteJid: string,
        payload: OutgoingMessagePayload
      ): Promise<SendMessageResult> => {
        "use server";

        const base = { url: apiKey!.url, key: apiKey!.key } as const;
        const instance = whatsappInstancia!.instanceName;

        const result = payload.kind === "text"
          ? await sendTextMessage(base, instance, remoteJid, payload.text, {
            delay: payload.delay,
            linkPreview: payload.linkPreview,
            mentionsEveryOne: payload.mentionsEveryOne,
            mentioned: payload.mentioned,
            quotedMessage: payload.quotedMessage,
          })
          : await sendMediaByUrl(base, instance, remoteJid, {
          mediatype: payload.mediatype,
          mediaUrl: payload.mediaUrl,
          mimetype: payload.mimetype,
          fileName: payload.fileName,
          caption: payload.caption,
          ptt: payload.ptt,
          delay: payload.delay,
          linkPreview: payload.linkPreview,
          mentionsEveryOne: payload.mentionsEveryOne,
          mentioned: payload.mentioned,
          quotedMessage: payload.quotedMessage,
        });

        if (result.success) {
          const historyEntry = buildOutgoingHistoryEntry(payload);

          try {
            await saveChatHistoryMessage({
              sessionId: buildChatHistorySessionId(instance, remoteJid),
              content: historyEntry.content,
              type: "notification",
              additionalKwargs: {
                channel: "whatsapp",
                provider: "evolution",
                direction: "outbound",
                source: "manual_chat_ui",
                remoteJid,
                ...historyEntry.additionalKwargs,
              },
              responseMetadata: {
                sentAt: new Date().toISOString(),
                instanceName: instance,
              },
            });
          } catch (historyError) {
            console.error("[CHATS] No se pudo guardar el historial del mensaje enviado.", historyError);
          }
        }

        return result;
      }
      : async (remoteJid: string): Promise<SendMessageResult> => ({
        success: false,
        message: "No hay instancia o API key configurada para enviar mensajes.",
        remoteJid,
      });


  const tagsRes = await listTagsAction(user.id);

  const allTags =
    tagsRes.data?.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      color: t.color,
      sessionCount: t._count?.sessionTags ?? 0,

    })) ?? [];

  return (
    <ChatsClient
      allTags={allTags}
      chatsResult={chatsResult}
      initialSelectedJid={initialSelectedJid}
      initialMessages={initialMessages}
      warmMessages={warmMessages}
      sendAny={sendAnyAction}          /* envío unificado */
      refetchChats={refetchChatsAction}
      instanceName={whatsappInstancia?.instanceName}
      apiKeyData={apiKey ? { url: apiKey.url, key: apiKey.key } : undefined} /* ⬅️ clave para media cifrada */
      userId={user.id}
    />
  );
}
