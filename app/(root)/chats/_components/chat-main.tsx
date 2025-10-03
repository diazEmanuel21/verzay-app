"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ArrowRight, ImageIcon, MoreVertical, Paperclip, ChevronDown, Loader2, Play, Mic } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// ------------------------------------------------
// TIPOS
// ------------------------------------------------

export type EvolutionMessage = {
  id?: string;
  key?: { id?: string; fromMe?: boolean; remoteJid?: string };
  messageType?: string;
  messageTimestamp?: number;
  pushName?: string | null;
  participant?: string | null;
  status?: string;
  message?: Record<string, unknown>;
  contextInfo?: Record<string, unknown> | null;
  remoteJid?: string;
};

type ChatHeader = { name: string; avatarSrc?: string; status?: string };
type ChatInfoMeta = {
  total?: number; pages?: number; currentPage?: number; nextPage?: number | null;
  instanceName?: string; remoteJid?: string;
};

type MediaType = "image" | "video" | "audio" | "document";
type MediaData = {
  type: MediaType;
  url: string;
  mimeType: string;
  caption?: string;
};

type UIBubble = {
  id: string;
  sender: "user" | "other";
  content: string;
  avatarSrc?: string;
  ts?: number;
  media?: MediaData; 
};

type ChatMainProps = {
  header: ChatHeader;
  messages: EvolutionMessage[];
  info?: ChatInfoMeta;
  loading?: boolean;
  /** Función que se ejecuta al enviar un mensaje. Recibe el texto del input. */
  handleSend: (message: string) => void;
};

interface MessageBubbleProps { 
  message: string; 
  isUserMessage: boolean; 
  avatarSrc?: string; 
  timestamp?: number;
  media?: MediaData;
}

interface ChatMessageListProps {
  uiMessages: UIBubble[];
  loading?: boolean;
  listRef: React.RefObject<HTMLDivElement>;
  info?: ChatInfoMeta;
}


// ------------------------------------------------
// UTILIDADES
// ------------------------------------------------

function extractMediaInfo(msg: any, type: MediaType): MediaData | null {
  const typeKey = `${type}Message`;
  const mediaObj = msg[typeKey] || {}; 

  const url = msg.mediaUrl || mediaObj.mediaUrl || mediaObj.url;
  const mimeType = mediaObj.mimetype || "unknown/mime";
  const caption = mediaObj.caption;

  if (url) {
    return {
      type,
      url,
      mimeType,
      caption: caption || undefined,
    };
  }
  return null;
}

/**
 * Transforma los mensajes de Evolution a la estructura de la UI.
 * Mantiene el orden cronológico ascendente (Antiguo primero, Nuevo último).
 */
function toUIMessages(messages: EvolutionMessage[], userJid: string | undefined): UIBubble[] {
  return messages.map(m => {
    const isUser = m.key?.fromMe === true || m.key?.remoteJid !== userJid; 
    const sender: "user" | "other" = isUser ? "user" : "other";
    const ts = m.messageTimestamp;

    let content = "";
    let media: MediaData | null = null;
    const messageData = m.message as any;

    if (m.messageType === "conversation" && messageData.conversation) {
      content = messageData.conversation as string;
    } else if (m.messageType === "extendedTextMessage" && messageData.extendedTextMessage?.text) {
      content = messageData.extendedTextMessage.text as string;
    } else if (m.messageType === "imageMessage") {
      media = extractMediaInfo(messageData, "image");
      content = media?.caption || "";
    } else if (m.messageType === "videoMessage") {
      media = extractMediaInfo(messageData, "video");
      content = media?.caption || "";
    } else if (m.messageType === "audioMessage") {
      media = extractMediaInfo(messageData, "audio");
      content = "";
    } else if (m.messageType === "documentMessage") {
      media = extractMediaInfo(messageData, "document");
      content = "";
    } else {
      content = `[Mensaje ${m.messageType || 'desconocido'}]`;
    }

    const uiMedia = media === null ? undefined : media;

    return {
      id: m.id || String(ts) + (m.key?.id || ""),
      sender,
      content,
      avatarSrc: sender === "user" ? "/user-avatar.png" : "/bot-avatar.png",
      ts: ts ? ts * 1000 : undefined,
      media: uiMedia,
    };
  }); 
}

// ------------------------------------------------
// COMPONENTES AUXILIARES DE LA UI
// ------------------------------------------------

/**
 * Muestra el contenido multimedia (Imagen, Video, Audio) basado en la URL de mediaUrl.
 */
const MediaRenderer: React.FC<{ media: MediaData | undefined }> = React.memo(({ media }) => {
  if (!media) return null;

  const { type, url, mimeType, caption } = media;

  const baseStyle = "my-1 rounded-md overflow-hidden border dark:border-gray-600";
  // Ancho largo para audios y documentos.
  const audioDocStyle = "w-full max-w-[350px]"; 

  return (
    <div className={cn(baseStyle, "max-w-full", type === "audio" || type === "document" ? audioDocStyle : "md:max-w-[300px]")}>
      {type === "image" && (
        <img 
          src={url} 
          alt={caption || "Imagen"} 
          className="w-full h-auto object-cover max-h-[300px] cursor-pointer" 
          onClick={() => window.open(url, "_blank")} 
        />
      )}
      {type === "video" && (
        <video src={url} controls className="w-full h-auto max-h-[300px] bg-black" poster={caption} />
      )}
      {type === "audio" && (
        <div className="p-2 bg-white dark:bg-gray-700 flex items-center border-t dark:border-gray-600">
          <Mic className="w-5 h-5 text-gray-500 dark:text-gray-300 mr-2 flex-shrink-0" />
          <audio src={url} controls className="flex-1 h-8" />
        </div>
      )}
      {type === "document" && (
        <a href={url} target="_blank" rel="noopener noreferrer" className="p-3 bg-blue-500 text-white flex items-center justify-between hover:bg-blue-600 transition">
          <span><Paperclip className="w-4 h-4 mr-2 inline-block" /> {caption || mimeType}</span>
          <ArrowRight className="w-4 h-4" />
        </a>
      )}
    </div>
  );
});
MediaRenderer.displayName = 'MediaRenderer';

/**
 * Componente de Burbuja de Mensaje (Estilo WhatsApp estándar)
 */
const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isUserMessage, avatarSrc, timestamp, media }) => {
  // Configuración estándar: Usuario Derecha (verde), Otro Izquierda (gris)
  const bubbleClass = isUserMessage
    ? "bg-green-500 text-white rounded-xl rounded-br-sm self-end" // Usuario a la derecha
    : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-xl rounded-tl-sm self-start"; // Otro a la izquierda

  const contentClass = isUserMessage ? "text-white" : "text-gray-800 dark:text-gray-100";
  const showAvatar = !isUserMessage; // Mostrar avatar solo para el "otro"

  return (
    <div className={cn("flex items-end gap-1 my-1 ", isUserMessage ? "justify-end" : "justify-start")}>
      
      {/* Avatar solo para "other" */}
      {showAvatar && (
        <Avatar className="w-7 h-7 flex-shrink-0"> 
          <AvatarImage src={avatarSrc} />
          <AvatarFallback>E</AvatarFallback>
        </Avatar>
      )}
      
      {/* La burbuja se ajusta al contenido (inline-block) con un ancho máximo. */}
      <div className={cn("p-2 break-words shadow-sm relative inline-block max-w-[90%] sm:max-w-[70%]", bubbleClass)}> 
        {media && <MediaRenderer media={media} />}
        <p className={cn("text-sm whitespace-pre-wrap", contentClass, "pr-10")}>{message}</p> 
        
        {timestamp && (
          <span className={cn("text-[0.6rem] mt-1 block absolute bottom-1 right-2 opacity-80", isUserMessage ? "text-green-900/60" : "text-gray-500/80 dark:text-gray-400/80")}>
            {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>
    </div>
  );
};

/**
 * Lista de Mensajes con Scroll y Lógica de Carga
 */
const ChatMessageList: React.FC<ChatMessageListProps> = ({ uiMessages, loading, listRef, info }) => {
  return (
    // CORREGIDO: 'flex-col' para ordenar de arriba a abajo (Antiguo a Nuevo)
    <div className="flex-1 overflow-y-auto p-4 flex flex-col custom-scrollbar w-full" ref={listRef}>
      
      {loading && (
        <div className="text-center text-gray-500 py-4">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
          <p>Cargando mensajes antiguos...</p>
        </div>
      )}

      {/* Los mensajes se mapean en orden cronológico ascendente */}
      {uiMessages.map((msg) => (
        <MessageBubble
          key={msg.id}
          message={msg.content}
          isUserMessage={msg.sender === "user"}
          avatarSrc={msg.avatarSrc}
          timestamp={msg.ts}
          media={msg.media}
        />
      ))}
    </div>
  );
};


// ------------------------------------------------
// COMPONENTE PRINCIPAL (ChatMain)
// ------------------------------------------------

export const ChatMain: React.FC<ChatMainProps> = ({ header, messages, info, loading, handleSend }) => {
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  const userJid = info?.remoteJid; 
  
  const uiMessages = useMemo(() => toUIMessages(messages.reverse(), userJid), [messages, userJid]);

  const onSend = useCallback(() => {
    if (input.trim()) {
      handleSend(input.trim());
      setInput("");
    }
  }, [input, handleSend]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSend();
      e.preventDefault(); 
    }
  }, [onSend]);

  // Efecto para hacer scroll al último mensaje
  useEffect(() => {
    if (listRef.current) {
      // CORREGIDO: Scroll al final de la lista (scrollHeight) para ver los mensajes nuevos.
      listRef.current.scrollTop = listRef.current.scrollHeight; 
    }
  }, [uiMessages.length]);

  return (
    // w-full para ser responsive.
    <div className="flex flex-col h-full w-full bg-white dark:bg-gray-800 border-l border-r">
      
      {/* Cabecera del Chat */}
      <div className="flex items-center justify-between p-4 border-b dark:border-gray-700 shadow-md bg-white dark:bg-gray-800 z-10">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={header.avatarSrc || "/default-avatar.png"} />
            <AvatarFallback>{header.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-lg dark:text-white">{header.name}</p>
            {header.status && <p className="text-sm text-gray-500 dark:text-gray-400">{header.status}</p>}
          </div>
        </div>
        <Button variant="ghost" size="icon"><MoreVertical className="w-5 h-5 dark:text-white" /></Button>
      </div>

      {/* Lista de Mensajes */}
      <ChatMessageList 
        uiMessages={uiMessages} 
        loading={loading} 
        listRef={listRef} 
        info={info} 
      />

      {/* Input de Mensaje */}
      <div className="p-3 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex items-center gap-2">
        <Button variant="ghost" size="icon" className="text-gray-500 dark:text-gray-400">
          <Paperclip className="w-5 h-5" />
        </Button>
        <Input
          type="text"
          placeholder="Escribe un mensaje..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1 bg-white dark:bg-gray-800 dark:text-white rounded-lg h-10 border-none"
        />
        <Button 
          onClick={onSend} 
          size="icon" 
          disabled={!input.trim()}
          className="rounded-full bg-blue-500 hover:bg-blue-600"
        >
          <ArrowRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};

export default ChatMain;