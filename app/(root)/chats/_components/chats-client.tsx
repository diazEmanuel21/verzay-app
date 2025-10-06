"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { ChatSidebar } from "./chat-sidebar";
import { ChatMain } from "./chat-main";

import type {
  EvolutionMessage,
  FetchChatsResult,
  FindMessagesResult,
  SendMessageResult,
} from "@/actions/chat-actions";

import type { OutgoingMessagePayload } from "./chat-main";
// import type { OutgoingMessagePayload } from "./attachment-menu";

interface ChatsClientProps {
  chatsResult: FetchChatsResult;
  initialSelectedJid: string;
  initialMessages: EvolutionMessage[];
  instanceName?: string;

  warmMessages?: (
    remoteJid: string,
    opts?: { page?: number; pageSize?: number }
  ) => Promise<FindMessagesResult>;

  /** ✅ NUEVO: Server Action unificada para enviar texto y media */
  sendAny: (remoteJid: string, payload: OutgoingMessagePayload) => Promise<SendMessageResult>;

  /** Server Action para refrescar la lista de chats */
  refetchChats: () => Promise<FetchChatsResult>;
}

export function ChatsClient({
  chatsResult: initialChatsResult,
  initialSelectedJid,
  initialMessages,
  warmMessages,
  sendAny,
  refetchChats,
  instanceName,
}: ChatsClientProps) {
  const [selectedJid, setSelectedJid] = useState(initialSelectedJid || "");
  const [currentChatsResult, setCurrentChatsResult] = useState(initialChatsResult);
  const [messages, setMessages] = useState<EvolutionMessage[]>(initialMessages || []);

  const [info, setInfo] = useState<
    | {
        total?: number; pages?: number; currentPage?: number; nextPage?: number | null;
        instanceName?: string; remoteJid?: string;
      }
    | undefined
  >(initialSelectedJid ? { instanceName, remoteJid: initialSelectedJid } : undefined);

  const [loading, setLoading] = useState(false);

  const contacts = useMemo(() => {
    return currentChatsResult.success ? currentChatsResult.data : [];
  }, [currentChatsResult]);

  const currentContact = useMemo(() => {
    if (!contacts.length || !selectedJid) return undefined;
    return contacts.find((c) => c.remoteJid === selectedJid);
  }, [contacts, selectedJid]);

  const header = useMemo(() => {
    return {
      name: currentContact?.pushName || selectedJid || "Sin contacto",
      avatarSrc: currentContact?.profilePicUrl || "/placeholder.svg",
      status: currentContact?.lastMessage?.messageTimestamp ? "último mensaje" : "—",
    };
  }, [currentContact, selectedJid]);

  // Autoselección inicial
  useEffect(() => {
    if (!selectedJid && contacts.length > 0) {
      const first = contacts[0].remoteJid;
      setSelectedJid(first);
      setInfo((i) => ({ ...(i ?? {}), instanceName, remoteJid: first }));
      if (!initialSelectedJid) setMessages([]);
    }
  }, [contacts, selectedJid, instanceName, initialSelectedJid]);

  // --- Polling comparativo de mensajes ---
  const pollAndCompareMessages = useCallback(
    async (remoteJid: string) => {
      if (!warmMessages) return;
      try {
        const page = 1;
        const pageSize = 50;
        const res = await warmMessages(remoteJid, { page, pageSize });

        if (res?.success) {
          const newMessages = res.data || [];
          setMessages((prevMsgs) => {
            if (newMessages.length !== prevMsgs.length) {
              setInfo({ ...res, instanceName, remoteJid });
              return newMessages;
            }
            return prevMsgs;
          });
        } else {
          console.warn("[ChatsClient] warmMessages error during polling:", res?.message);
        }
      } catch (e) {
        console.error("[ChatsClient] warmMessages exception during polling:", e);
      }
    },
    [warmMessages, instanceName]
  );

  // Cambiar chat
  const handleSelectFromSidebar = useCallback(
    async (remoteJid: string) => {
      if (selectedJid !== remoteJid) setSelectedJid(remoteJid);

      setInfo((i) => ({ ...(i ?? {}), instanceName, remoteJid }));
      setLoading(true);
      setMessages([]);

      if (!warmMessages) {
        setLoading(false);
        return;
      }

      try {
        const page = 1;
        const pageSize = 50;
        const res = await warmMessages(remoteJid, { page, pageSize });

        if (res?.success) {
          setMessages(res.data || []);
          setInfo({ ...res, instanceName, remoteJid });
        } else {
          setMessages([]);
          setInfo((i) => ({ ...(i ?? {}), instanceName, remoteJid }));
          console.warn("[ChatsClient] warmMessages error:", res?.message);
        }
      } catch (e) {
        setMessages([]);
        setInfo((i) => ({ ...(i ?? {}), instanceName, remoteJid }));
        console.error("[ChatsClient] warmMessages exception:", e);
      } finally {
        setLoading(false);
      }
    },
    [selectedJid, warmMessages, instanceName]
  );

  // ✅ Envío unificado (texto o media) + refresco
  const handleSendAny = useCallback(
    async (payload: OutgoingMessagePayload) => {
      if (!selectedJid || !sendAny) {
        console.warn("[ChatsClient] No se puede enviar: remoteJid no seleccionado o función sendAny no proporcionada.");
        return;
      }

      const result = await sendAny(selectedJid, payload);

      if (result.success) {
        // 1) refrescar mensajes del chat actual
        if (warmMessages) {
          pollAndCompareMessages(selectedJid);
        }
        // 2) refrescar lista de chats (sidebar)
        const chatRefreshResult = await refetchChats();
        if (chatRefreshResult.success) {
          setCurrentChatsResult(chatRefreshResult);
        }
      } else {
        console.error("❌ Error al enviar:", result.message, result.raw);
      }
    },
    [selectedJid, sendAny, warmMessages, refetchChats, pollAndCompareMessages]
  );

  // Polling sidebar
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    const fetchNewChats = async () => {
      const result = await refetchChats();
      if (result.success) {
        setCurrentChatsResult(result);
      } else {
        console.warn("[ChatsClient] Fallo al refrescar chats:", result.message);
      }
    };

    if (initialChatsResult.success) {
      intervalId = setInterval(fetchNewChats, 10000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [refetchChats, initialChatsResult.success]);

  // Polling chat
  useEffect(() => {
    let messagePollingId: NodeJS.Timeout | null = null;

    const pollMessages = () => {
      if (selectedJid && warmMessages) {
        pollAndCompareMessages(selectedJid);
      }
    };

    if (selectedJid && warmMessages) {
      if (messages.length === 0 && !loading) {
        handleSelectFromSidebar(selectedJid);
      }
      messagePollingId = setInterval(pollMessages, 700);
    }

    return () => {
      if (messagePollingId) clearInterval(messagePollingId);
    };
  }, [selectedJid, warmMessages, pollAndCompareMessages, handleSelectFromSidebar, loading, messages.length]);

  return (
    <div className="flex h-full">
      <ChatSidebar
        result={currentChatsResult}
        onSelectRemoteJid={handleSelectFromSidebar}
        selectedJid={selectedJid}
      />
      <ChatMain
        key={selectedJid || "no-jid"}
        header={{
          name: currentContact?.pushName || selectedJid || "Sin contacto",
          avatarSrc: currentContact?.profilePicUrl || "/placeholder.svg",
          status: currentContact?.lastMessage?.messageTimestamp ? "último mensaje" : "—",
        }}
        messages={messages}
        info={info}
        loading={loading}
        /** ⬇️ ahora ChatMain recibe onSend(payload) */
        onSend={handleSendAny}
      />
    </div>
  );
}
