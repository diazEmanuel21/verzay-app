"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChatSidebar } from "./chat-sidebar";
import { ChatMain } from "./chat-main";

import type {
  EvolutionMessage,
  FetchChatsResult,
  FindMessagesResult,
  SendMessageResult,
} from "@/actions/chat-actions";
import type { OutgoingMessagePayload } from "./chat-main";

/* -------------------------------------
   Helpers de comparación y polling
-------------------------------------- */
function getLastIdTimestamp(list: EvolutionMessage[]) {
  if (!list || list.length === 0) return { id: undefined as string | undefined, ts: 0 };
  const sorted = [...list].sort((a, b) => (a.messageTimestamp ?? 0) - (b.messageTimestamp ?? 0));
  const last = sorted[sorted.length - 1];
  return { id: last?.key?.id, ts: last?.messageTimestamp ?? 0 };
}

function areListsDifferent(a: EvolutionMessage[], b: EvolutionMessage[]) {
  if (a.length !== b.length) return true;
  const la = getLastIdTimestamp(a);
  const lb = getLastIdTimestamp(b);
  return la.id !== lb.id || la.ts !== lb.ts;
}

/* -------------------------------------
   Props del componente
-------------------------------------- */
interface ChatsClientProps {
  chatsResult: FetchChatsResult;
  initialSelectedJid: string;
  initialMessages: EvolutionMessage[];
  instanceName?: string;

  warmMessages?: (
    remoteJid: string,
    opts?: { page?: number; pageSize?: number }
  ) => Promise<FindMessagesResult>;

  /** Server Action unificada para enviar texto o media */
  sendAny: (remoteJid: string, payload: OutgoingMessagePayload) => Promise<SendMessageResult>;

  /** Server Action para refrescar la lista de chats */
  refetchChats: () => Promise<FetchChatsResult>;
}

/* -------------------------------------
   Componente principal
-------------------------------------- */
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

  // --- Control del polling del chat
  const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef = useRef(false);
  const backoffRef = useRef(0);           // ms (0 = intervalo base)
  const BASE_INTERVAL = 2000;             // 2s base
  const MAX_BACKOFF = 30000;              // 30s

  // Lista de contactos para sidebar
  const contacts = useMemo(() => {
    return currentChatsResult.success ? currentChatsResult.data : [];
  }, [currentChatsResult]);

  const currentContact = useMemo(() => {
    if (!contacts.length || !selectedJid) return undefined;
    return contacts.find((c) => c.remoteJid === selectedJid);
  }, [contacts, selectedJid]);

  // Header del chat (izquierda)
  const header = useMemo(() => {
    return {
      name: currentContact?.pushName || selectedJid || "Sin contacto",
      avatarSrc: currentContact?.profilePicUrl || "/placeholder.svg",
      status: currentContact?.lastMessage?.messageTimestamp ? "último mensaje" : "—",
    };
  }, [currentContact, selectedJid]);

  // Autoselección inicial si no hay JID seleccionado
  useEffect(() => {
    if (!selectedJid && contacts.length > 0) {
      const first = contacts[0].remoteJid;
      setSelectedJid(first);
      setInfo((i) => ({ ...(i ?? {}), instanceName, remoteJid: first }));
      if (!initialSelectedJid) setMessages([]);
    }
  }, [contacts, selectedJid, instanceName, initialSelectedJid]);

  // --- Polling comparativo de mensajes (robusto)
  const pollAndCompareMessages = useCallback(
    async (remoteJid: string) => {
      if (!warmMessages || inFlightRef.current) return;
      if (typeof document !== "undefined" && document.hidden) return; // pausa si la pestaña está oculta

      inFlightRef.current = true;
      try {
        const page = 1;
        const pageSize = 50;
        const res = await warmMessages(remoteJid, { page, pageSize });

        if (res?.success) {
          const newMessages = res.data || [];
          setMessages((prevMsgs) => {
            if (areListsDifferent(prevMsgs, newMessages)) {
              setInfo({ ...res, instanceName, remoteJid });
              return newMessages;
            }
            return prevMsgs;
          });
          // Reinicia backoff en éxito
          backoffRef.current = 0;
        } else {
          console.warn("[ChatsClient] warmMessages error during polling:", res?.message);
          backoffRef.current = Math.min((backoffRef.current || BASE_INTERVAL) * 2, MAX_BACKOFF);
        }
      } catch (e) {
        console.error("[ChatsClient] warmMessages exception during polling:", e);
        backoffRef.current = Math.min((backoffRef.current || BASE_INTERVAL) * 2, MAX_BACKOFF);
      } finally {
        inFlightRef.current = false;
      }
    },
    [warmMessages, instanceName]
  );

  // Cambiar chat desde sidebar
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

  // Envío unificado (texto o media) + refrescos
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
          await pollAndCompareMessages(selectedJid);
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

  // Polling sidebar (setTimeout para evitar solapamientos)
  useEffect(() => {
    let stopped = false;
    let t: ReturnType<typeof setTimeout> | null = null;

    const loop = async () => {
      if (stopped) return;
      const result = await refetchChats();
      if (result.success) {
        setCurrentChatsResult(result);
      } else {
        console.warn("[ChatsClient] Fallo al refrescar chats:", result.message);
      }
      t = setTimeout(loop, 10000);
    };

    if (initialChatsResult.success) {
      void loop();
    }

    return () => {
      stopped = true;
      if (t) clearTimeout(t);
    };
  }, [refetchChats, initialChatsResult.success]);

  // Polling del chat (robusto: sin solaparse, con backoff, pausa en background)
  useEffect(() => {
    // limpia cualquier timer previo
    if (pollingRef.current) {
      clearTimeout(pollingRef.current);
      pollingRef.current = null;
    }

    let stopped = false;

    const tick = async () => {
      if (stopped) return;

      if (selectedJid && warmMessages) {
        // Si no hay mensajes y no está cargando, trae el primer lote
        if (messages.length === 0 && !loading) {
          await handleSelectFromSidebar(selectedJid);
        } else {
          await pollAndCompareMessages(selectedJid);
        }
      }

      // calcula próximo intervalo con backoff (si 0 => BASE_INTERVAL)
      const wait = backoffRef.current > 0 ? backoffRef.current : BASE_INTERVAL;

      pollingRef.current = setTimeout(() => {
        void tick();
      }, wait);
    };

    // arranque
    if (selectedJid && warmMessages) {
      void tick();
    }

    // pausa/reanuda según visibilidad
    const onVisibility = () => {
      if (document.hidden) {
        if (pollingRef.current) {
          clearTimeout(pollingRef.current);
          pollingRef.current = null;
        }
      } else {
        // reanudar inmediatamente al volver a foreground
        backoffRef.current = 0;
        if (!pollingRef.current) void tick();
      }
    };

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", onVisibility);
    }

    return () => {
      stopped = true;
      if (pollingRef.current) clearTimeout(pollingRef.current);
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", onVisibility);
      }
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
        header={header}
        messages={messages}
        info={info}
        loading={loading}
        onSend={handleSendAny}
      />
    </div>
  );
}
