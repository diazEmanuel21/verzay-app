"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChatSidebar } from "./chat-sidebar";
import { ChatMain } from "./chat-main";

import type {
  ChatData,
  EvolutionMessage,
  FetchChatsResult,
  FindMessagesResult,
  SendMessageResult,
} from "@/actions/chat-actions";
import { getChatContactSessions } from "@/actions/session-action";
import type { OutgoingMessagePayload } from "./chat-main";
import type {
  ChatContactDescriptor,
  ChatContactSessionMap,
  ChatContactSessionSummary,
  Session,
  SimpleTag,
} from "@/types/session";

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
   Tipos locales
-------------------------------------- */
type ApiKeyData = { url: string; key: string };

function buildChatContactDescriptors(chats: ChatData[]): ChatContactDescriptor[] {
  return chats
    .filter((chat) => chat.remoteJid && chat.remoteJid !== "status@broadcast")
    .map((chat) => ({
      remoteJid: chat.remoteJid,
      remoteJidAlt: chat.remoteJidAlt,
      senderPn: chat.senderPn,
      pushName: chat.pushName,
      aliases: chat.aliases,
    }));
}

function mapSessionToChatContactSummary(session: Session): ChatContactSessionSummary {
  return {
    id: session.id,
    userId: session.userId,
    remoteJid: session.remoteJid,
    remoteJidAlt: session.remoteJidAlt,
    pushName: session.pushName,
    tags: session.tags ?? [],
  };
}

/* -------------------------------------
   Props del componente
-------------------------------------- */
interface ChatsClientProps {
  userId: string;
  chatsResult: FetchChatsResult;
  initialChatSessions: ChatContactSessionMap;
  initialSelectedJid: string;
  initialMessages: EvolutionMessage[];
  instanceName?: string;

  warmMessages?: (
    remoteJid: string,
    opts?: { page?: number; pageSize?: number; remoteJidAliases?: string[] }
  ) => Promise<FindMessagesResult>;

  /** Server Action unificada para enviar texto o media */
  sendAny: (remoteJid: string, payload: OutgoingMessagePayload) => Promise<SendMessageResult>;

  /** Server Action para refrescar la lista de chats */
  refetchChats: () => Promise<FetchChatsResult>;

  /** NUEVO: credenciales para que ChatMain pueda resolver media cifrada */
  apiKeyData?: ApiKeyData;

  allTags: SimpleTag[];
}

/* -------------------------------------
   Componente principal
-------------------------------------- */
export function ChatsClient({
  chatsResult: initialChatsResult,
  initialChatSessions,
  initialSelectedJid,
  initialMessages,
  warmMessages,
  sendAny,
  refetchChats,
  instanceName,
  apiKeyData,
  userId,
  allTags
}: ChatsClientProps) {
  const initialSelectedChat =
    initialChatsResult.success && initialSelectedJid
      ? initialChatsResult.data.find(
        (chat) => chat.remoteJid === initialSelectedJid || chat.aliases?.includes(initialSelectedJid)
      )
      : undefined;
  const [selectedJid, setSelectedJid] = useState(initialSelectedJid || "");
  const [currentChatsResult, setCurrentChatsResult] = useState(initialChatsResult);
  const [chatSessions, setChatSessions] = useState<ChatContactSessionMap>(initialChatSessions);
  const [messages, setMessages] = useState<EvolutionMessage[]>(initialMessages || []);
  const [info, setInfo] = useState<
    | {
      total?: number;
      pages?: number;
      currentPage?: number;
      nextPage?: number | null;
      instanceName?: string;
      remoteJid?: string;
      remoteJidAliases?: string[];
      apiKeyData?: ApiKeyData;
    }
    | undefined
  >(
    initialSelectedJid
      ? {
        instanceName,
        remoteJid: initialSelectedJid,
        remoteJidAliases: initialSelectedChat?.aliases,
        apiKeyData,
      }
      : undefined
  );

  const [loading, setLoading] = useState(false);

  // 🆕 ESTADO: Controla si la barra lateral (Sidebar) es visible
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);

  // --- Control del polling del chat
  const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef = useRef(false);
  const backoffRef = useRef(0);
  const BASE_INTERVAL = 2000;
  const MAX_BACKOFF = 30000;

  //  Filtro: excluir "status@broadcast"
  const contacts = useMemo(() => {
    if (!currentChatsResult.success) return [];
    return currentChatsResult.data.filter(
      (c) => c.remoteJid && c.remoteJid !== "status@broadcast"
    );
  }, [currentChatsResult]);

  const currentContact = useMemo(() => {
    if (!contacts.length || !selectedJid) return undefined;
    return contacts.find((c) => c.remoteJid === selectedJid || c.aliases?.includes(selectedJid));
  }, [contacts, selectedJid]);

  const currentContactSession = useMemo(() => {
    if (!selectedJid) return undefined;
    return chatSessions[selectedJid];
  }, [chatSessions, selectedJid]);

  const header = useMemo(() => {
    return {
      name: currentContactSession?.pushName?.trim() || currentContact?.pushName || selectedJid || "Sin contacto",
      avatarSrc: currentContact?.profilePicUrl || "/placeholder.svg",
      status: currentContact?.lastMessage?.messageTimestamp ? "último mensaje" : "—",
    };
  }, [currentContact, currentContactSession, selectedJid]);

  // Autoselección inicial si no hay JID seleccionado
  useEffect(() => {
    if (!selectedJid && contacts.length > 0) {
      const firstContact = contacts[0];
      const first = firstContact.remoteJid;
      setSelectedJid(first);
      setInfo((i) => ({
        ...(i ?? {}),
        instanceName,
        remoteJid: first,
        remoteJidAliases: firstContact.aliases,
        apiKeyData,
      }));
      if (!initialSelectedJid) setMessages([]);
      // 🆕 En la autoselección inicial, si hay un JID inicial, oculta la sidebar (comportamiento de móvil)
      if (initialSelectedJid) setIsSidebarVisible(false);
    }
  }, [contacts, selectedJid, instanceName, initialSelectedJid, apiKeyData]);

  // 🆕 HANDLER: Alterna la visibilidad de la barra lateral
  const toggleSidebarVisibility = useCallback(() => {
    setIsSidebarVisible((prev) => !prev);
  }, []);

  const refreshChatSessions = useCallback(
    async (chats: ChatData[]) => {
      const descriptors = buildChatContactDescriptors(chats);

      if (descriptors.length === 0) {
        setChatSessions({});
        return;
      }

      const result = await getChatContactSessions(userId, descriptors);
      if (result.success) {
        setChatSessions(result.data ?? {});
      }
    },
    [userId]
  );

  const handleSessionResolved = useCallback(
    (remoteJid: string, session: Session | null) => {
      setChatSessions((prev) => {
        if (!remoteJid) return prev;

        if (!session) {
          if (!(remoteJid in prev)) return prev;
          const next = { ...prev };
          delete next[remoteJid];
          return next;
        }

        return {
          ...prev,
          [remoteJid]: mapSessionToChatContactSummary(session),
        };
      });
    },
    []
  );

  const handleSessionTagsChange = useCallback(
    (remoteJid: string, selectedIds: number[]) => {
      setChatSessions((prev) => {
        const currentSession = prev[remoteJid];
        if (!currentSession) return prev;

        return {
          ...prev,
          [remoteJid]: {
            ...currentSession,
            tags: allTags.filter((tag) => selectedIds.includes(tag.id)),
          },
        };
      });
    },
    [allTags]
  );

  const pollAndCompareMessages = useCallback(
    async (remoteJid: string, remoteJidAliases?: string[]) => {
      if (!warmMessages || inFlightRef.current) return;
      if (typeof document !== "undefined" && document.hidden) return;

      inFlightRef.current = true;
        try {
          const page = 1;
          const pageSize = 50;
          const res = await warmMessages(remoteJid, { page, pageSize, remoteJidAliases });

          if (res?.success) {
            const newMessages = res.data || [];
            setMessages((prevMsgs) => {
              if (areListsDifferent(prevMsgs, newMessages)) {
                setInfo({ ...res, instanceName, remoteJid, remoteJidAliases, apiKeyData });
                return newMessages;
              }
              return prevMsgs;
          });
          backoffRef.current = 0;
        } else {
          backoffRef.current = Math.min(
            (backoffRef.current || BASE_INTERVAL) * 2,
            MAX_BACKOFF
          );
        }
      } catch {
        backoffRef.current = Math.min(
          (backoffRef.current || BASE_INTERVAL) * 2,
          MAX_BACKOFF
        );
      } finally {
        inFlightRef.current = false;
      }
    },
    [warmMessages, instanceName, apiKeyData]
  );

  const handleSelectFromSidebar = useCallback(
    async (remoteJid: string) => {
      const selectedContact = contacts.find(
        (contact) => contact.remoteJid === remoteJid || contact.aliases?.includes(remoteJid)
      );
      const remoteJidAliases = selectedContact?.aliases;

      if (selectedJid !== remoteJid) setSelectedJid(remoteJid);

      // 🆕 LÓGICA DE VISIBILIDAD: Oculta la Sidebar al seleccionar un chat (para móvil)
      if (isSidebarVisible) setIsSidebarVisible(false);

      setInfo((i) => ({ ...(i ?? {}), instanceName, remoteJid, remoteJidAliases, apiKeyData }));
      setLoading(true);
      setMessages([]);

      if (!warmMessages) {
        setLoading(false);
        return;
      }

      try {
        const page = 1;
        const pageSize = 50;
        const res = await warmMessages(remoteJid, { page, pageSize, remoteJidAliases });

        if (res?.success) {
          setMessages(res.data || []);
          setInfo({ ...res, instanceName, remoteJid, remoteJidAliases, apiKeyData });
        } else {
          setMessages([]);
          setInfo((i) => ({ ...(i ?? {}), instanceName, remoteJid, remoteJidAliases, apiKeyData }));
        }
      } catch {
        setMessages([]);
        setInfo((i) => ({ ...(i ?? {}), instanceName, remoteJid, remoteJidAliases, apiKeyData }));
      } finally {
        setLoading(false);
      }
    },
    [selectedJid, warmMessages, instanceName, apiKeyData, isSidebarVisible, contacts]
  );

  const handleSendAny = useCallback(
    async (payload: OutgoingMessagePayload) => {
      if (!selectedJid || !sendAny) {
        throw new Error("No hay un chat seleccionado para enviar el mensaje.");
      }

      const result = await sendAny(selectedJid, payload);

      if (!result.success) {
        throw new Error(result.message || "No se pudo enviar el mensaje.");
      }

      if (warmMessages) await pollAndCompareMessages(selectedJid, currentContact?.aliases);
      const chatRefreshResult = await refetchChats();
      if (chatRefreshResult.success) {
        const filtered = {
          ...chatRefreshResult,
          data: chatRefreshResult.data.filter(
            (c) => c.remoteJid && c.remoteJid !== "status@broadcast"
          ),
        };
        setCurrentChatsResult(filtered);
        await refreshChatSessions(filtered.data);
      }
    },
    [selectedJid, sendAny, warmMessages, refetchChats, pollAndCompareMessages, currentContact, refreshChatSessions]
  );

  // Polling sidebar
  useEffect(() => {
    let stopped = false;
    let t: ReturnType<typeof setTimeout> | null = null;

    const loop = async () => {
      if (stopped) return;
      const result = await refetchChats();
      if (result.success) {
        const filtered = {
          ...result,
          data: result.data.filter(
            (c) => c.remoteJid && c.remoteJid !== "status@broadcast"
          ),
        };
        setCurrentChatsResult(filtered);
        await refreshChatSessions(filtered.data);
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
  }, [refetchChats, initialChatsResult.success, refreshChatSessions]);

  // Polling mensajes
  useEffect(() => {
    if (pollingRef.current) {
      clearTimeout(pollingRef.current);
      pollingRef.current = null;
    }

    let stopped = false;
    const tick = async () => {
      if (stopped) return;

      if (selectedJid && warmMessages) {
        if (messages.length === 0 && !loading) {
          await handleSelectFromSidebar(selectedJid);
        } else {
          await pollAndCompareMessages(selectedJid, currentContact?.aliases);
        }
      }

      const wait = backoffRef.current > 0 ? backoffRef.current : BASE_INTERVAL;
      pollingRef.current = setTimeout(() => void tick(), wait);
    };

    if (selectedJid && warmMessages) void tick();

    const onVisibility = () => {
      if (document.hidden) {
        if (pollingRef.current) {
          clearTimeout(pollingRef.current);
          pollingRef.current = null;
        }
      } else {
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
  }, [
    selectedJid,
    currentContact,
    warmMessages,
    pollAndCompareMessages,
    handleSelectFromSidebar,
    loading,
    messages.length,
  ]);


  return (
    <div className="flex h-full overflow-hidden">
      {/* LOGICA RESPONSIVE:
        - Si isSidebarVisible es TRUE: 
          - En móvil: Muestra la Sidebar (w-full) y oculta ChatMain (ocupa todo el espacio).
          - En escritorio (sm+): Muestra ambas. Sidebar con ancho fijo, ChatMain con flex-1.
        - Si isSidebarVisible es FALSE:
          - En móvil: Oculta la Sidebar y muestra ChatMain (w-full).
          - En escritorio (sm+): Muestra ambas.
      */}

      {/* CHAT SIDEBAR */}
      <div
        className={`${isSidebarVisible ? 'w-full sm:w-80 md:w-96' : 'hidden md:block sm:w-80 md:w-96'
          } flex-shrink-0 h-full border-r transition-all duration-300 ${!isSidebarVisible ? 'hidden' : '' // Ocultar totalmente en móvil si el chat principal está activo
          }`}
      >
        <ChatSidebar
          allTags={allTags}
          chatSessions={chatSessions}
          result={currentChatsResult}
          onSessionTagsChange={handleSessionTagsChange}
          onSelectRemoteJid={handleSelectFromSidebar}
          selectedJid={selectedJid}
        />
      </div>

      {/* CHAT MAIN */}
      <div
        className={`${!isSidebarVisible ? 'flex-1 w-full' : 'hidden sm:flex-1'
          } h-full transition-all duration-300`}
      >
        {selectedJid ? (
          <ChatMain
            key={selectedJid || "no-jid"}
            header={header}
            messages={messages}
            info={info}
            loading={loading}
            onSend={handleSendAny}
            // 🆕 PROP: Función para volver a la lista (usada en un botón dentro de ChatMain)
            onBackToList={toggleSidebarVisibility}
            userId={userId}
            allTags={allTags}
            onSessionResolved={handleSessionResolved}
            onSessionTagsChange={handleSessionTagsChange}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center h-full text-gray-500">
            {isSidebarVisible ? "Selecciona un chat." : "Cargando chats..."}
          </div>
        )}
      </div>
    </div>
  );
}
