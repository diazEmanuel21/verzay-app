"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ArrowRight, Mic, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

import {
  AttachmentMenu,
  type ComposeMedia,
  type MediaType,
} from "./attachment-menu";

/* -------- Outgoing payload unificado -------- */
export type OutgoingTextPayload = {
  kind: "text";
  text: string;
  delay?: number;
  linkPreview?: boolean;
  mentionsEveryOne?: boolean;
  mentioned?: string[];
  quotedMessage?: { key: { id: string }; message: { conversation: string } };
};
export type OutgoingMediaPayload = {
  kind: "media";
  mediatype: MediaType;
  mediaUrl: string;   // Data URL Base64
  mimetype?: string;
  fileName?: string;
  caption?: string;
  ptt?: boolean;
  delay?: number;
  linkPreview?: boolean;
  mentionsEveryOne?: boolean;
  mentioned?: string[];
  quotedMessage?: { key: { id: string }; message: { conversation: string } };
};
export type OutgoingMessagePayload = OutgoingTextPayload | OutgoingMediaPayload;

/* -------- Evolution / UI -------- */
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
export type MediaData = { type: MediaType; url: string; mimeType: string; caption?: string; };
type UIBubble = { id: string; sender: "user" | "other"; content: string; avatarSrc?: string; ts?: number; media?: MediaData; };

type ChatMainProps = {
  header: ChatHeader;
  messages: EvolutionMessage[];
  info?: ChatInfoMeta;
  loading?: boolean;
  onSend: (payload: OutgoingMessagePayload) => void | Promise<void>;
};

/* -------- Helpers de formateo -------- */
function extractMediaInfo(msg: any, type: MediaType): MediaData | null {
  const typeKey = `${type}Message`;
  const mediaObj = msg[typeKey] || {};
  const url = msg.mediaUrl || mediaObj.mediaUrl || mediaObj.url;
  const mimeType = mediaObj.mimetype || "unknown/mime";
  const caption = mediaObj.caption;
  if (url) return { type, url, mimeType, caption: caption || undefined };
  return null;
}

function toUIMessages(messages: EvolutionMessage[], userJid: string | undefined): UIBubble[] {
  return messages.map((m) => {
    const isUser = m.key?.fromMe === true || m.key?.remoteJid !== userJid;
    const sender: "user" | "other" = isUser ? "user" : "other";
    const ts = m.messageTimestamp;
    let content = "";
    let media: MediaData | null = null;
    const messageData = m.message as any;

    if (m.messageType === "conversation" && messageData?.conversation) content = messageData.conversation as string;
    else if (m.messageType === "extendedTextMessage" && messageData?.extendedTextMessage?.text) content = messageData.extendedTextMessage.text as string;
    else if (m.messageType === "imageMessage") { media = extractMediaInfo(messageData, "image"); content = media?.caption || ""; }
    else if (m.messageType === "videoMessage") { media = extractMediaInfo(messageData, "video"); content = media?.caption || ""; }
    else if (m.messageType === "audioMessage") { media = extractMediaInfo(messageData, "audio"); content = ""; }
    else if (m.messageType === "documentMessage") { media = extractMediaInfo(messageData, "document"); content = media?.caption || ""; }
    else content = `[Mensaje ${m.messageType || "desconocido"}]`;

    return {
      id: m.id || String(ts) + (m.key?.id || ""),
      sender,
      content,
      avatarSrc: sender === "user" ? "/user-avatar.png" : "/bot-avatar.png",
      ts: ts ? ts * 1000 : undefined,
      media: media || undefined,
    };
  });
}

/* -------- Subcomponentes de UI -------- */
const MediaRenderer: React.FC<{ media: MediaData | undefined }> = React.memo(({ media }) => {
  if (!media) return null;
  const { type, url, mimeType, caption } = media;
  const baseStyle = "my-1 rounded-md overflow-hidden border dark:border-gray-600";
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
      {type === "video" && <video src={url} controls className="w-full h-auto max-h-[300px] bg-black" poster={caption} />}
      {type === "audio" && (
        <div className="p-2 bg-white dark:bg-gray-700 flex items-center border-t dark:border-gray-600">
          <Mic className="w-5 h-5 text-gray-500 dark:text-gray-300 mr-2 flex-shrink-0" />
          <audio src={url} controls className="flex-1 h-8" />
        </div>
      )}
      {type === "document" && (
        <a href={url} target="_blank" rel="noopener noreferrer" className="p-3 bg-blue-500 text-white flex items-center justify-between hover:bg-blue-600 transition">
          <span className="truncate">{caption || mimeType}</span>
          <ArrowRight className="w-4 h-4" />
        </a>
      )}
    </div>
  );
});
MediaRenderer.displayName = "MediaRenderer";

const MessageBubble: React.FC<{
  message: string; isUserMessage: boolean; avatarSrc?: string; timestamp?: number; media?: MediaData;
}> = ({ message, isUserMessage, avatarSrc, timestamp, media }) => {
  const bubbleClass = isUserMessage
    ? "bg-primary text-white rounded-xl rounded-br-sm self-end"
    : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-xl rounded-tl-sm self-start";
  const contentClass = isUserMessage ? "text-white" : "text-gray-800 dark:text-gray-100";
  const showAvatar = !isUserMessage;

  return (
    <div className={cn("flex items-end gap-1 my-1 ", isUserMessage ? "justify-end" : "justify-start")}>
      {showAvatar && (
        <div className="mr-1">
          <Avatar className="w-7 h-7">
            <AvatarImage src={avatarSrc} />
            <AvatarFallback>E</AvatarFallback>
          </Avatar>
        </div>
      )}
      <div className={cn("p-2 break-words shadow-sm relative inline-block max-w-[90%] sm:max-w-[70%]", bubbleClass)}>
        {media && <MediaRenderer media={media} />}
        {message && <p className={cn("text-sm whitespace-pre-wrap", contentClass, "pr-10")}>{message}</p>}
        {timestamp && (
          <span className={cn("text-[0.6rem] mt-1 block bottom-1 right-2", isUserMessage ? "text-black" : "text-black dark:text-gray-400/80")}>
            {new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>
    </div>
  );
};

const ChatMessageList: React.FC<{
  uiMessages: UIBubble[]; loading?: boolean; listRef: React.RefObject<HTMLDivElement>;
}> = ({ uiMessages, loading, listRef }) => {
  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col custom-scrollbar w-full" ref={listRef}>
      {loading && <div className="text-center text-gray-500 py-4">Cargando mensajes…</div>}
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

/* -------- Componente principal -------- */
export const ChatMain: React.FC<ChatMainProps> = ({ header, messages, info, loading, onSend }) => {
  const [input, setInput] = useState("");
  const [composeMedia, setComposeMedia] = useState<ComposeMedia | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const userJid = info?.remoteJid;

  const uiMessages = useMemo(() => toUIMessages(messages.slice().reverse(), userJid), [messages, userJid]);

  // Cuando se selecciona un archivo, pre-cargar el caption con el nombre del archivo
  const handleComposeMediaChange = useCallback((m: ComposeMedia | null) => {
    setComposeMedia(m);
    if (m) {
      setInput(m.fileName || "");
    }
  }, []);

  const clearComposeMedia = useCallback(() => setComposeMedia(null), []);

  const sendNow = useCallback(async () => {
    // Media → enviar media (caption por defecto = filename si input vacío)
    if (composeMedia) {
      const payload: OutgoingMessagePayload = {
        kind: "media",
        mediatype: composeMedia.mediatype,
        mediaUrl: composeMedia.dataUrl,
        mimetype: composeMedia.mimeType,
        fileName: composeMedia.fileName,
        caption: (input && input.trim()) ? input.trim() : composeMedia.fileName,
      };
      await onSend(payload);
      setInput("");
      setComposeMedia(null);
      return;
    }

    // Texto → enviar texto
    const text = input.trim();
    if (text) {
      const payload: OutgoingMessagePayload = { kind: "text", text };
      await onSend(payload);
      setInput("");
    }
  }, [composeMedia, input, onSend]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      void sendNow();
    }
  }, [sendNow]);

  // Auto-scroll al final cuando cambian los mensajes
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [uiMessages.length]);

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-gray-800 border-l border-r">
      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b dark:border-gray-700 shadow-md bg-white dark:bg-gray-800 z-10">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={header.avatarSrc || "/default-avatar.png"} />
            <AvatarFallback>{header.name?.charAt(0) ?? "?"}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-md dark:text-white">{header.name}</p>
          </div>
        </div>
      </div>

      {/* Mensajes */}
      <ChatMessageList uiMessages={uiMessages} loading={loading} listRef={listRef} />

      {/* Barra de mensaje con clip, thumbnail y caption por defecto */}
      <div className="p-3 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        {composeMedia && (
          <div className="mb-2 flex items-center gap-2">
            {composeMedia.mediatype === "image" ? (
              <div className="relative w-16 h-16 rounded-md overflow-hidden border bg-white dark:bg-gray-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={composeMedia.dataUrl} alt={composeMedia.fileName} className="w-full h-full object-cover" />
                <button
                  className="absolute -top-2 -right-2 bg-black/70 text-white rounded-full p-1"
                  onClick={clearComposeMedia}
                  aria-label="Quitar adjunto"
                  type="button"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="relative w-16 h-16 rounded-md overflow-hidden border bg-white dark:bg-gray-800 flex items-center justify-center text-xs px-1 text-center">
                <span className="truncate">{composeMedia.fileName}</span>
                <button
                  className="absolute -top-2 -right-2 bg-black/70 text-white rounded-full p-1"
                  onClick={clearComposeMedia}
                  aria-label="Quitar adjunto"
                  type="button"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            <div className="text-xs text-gray-600 dark:text-gray-300">
              <div className="font-medium truncate max-w-[180px]">{composeMedia.fileName}</div>
              <div className="opacity-80">{composeMedia.mimeType}</div>
              <div className="opacity-80 capitalize">{composeMedia.mediatype}</div>
            </div>
          </div>
        )}

        <div className="relative flex items-center gap-2">
          {/* Clip con menú de adjuntos */}
          <div className="absolute left-1 z-10">
            <AttachmentMenu onComposeMediaChange={handleComposeMediaChange} maxBase64MB={8} />
          </div>

          {/* Input (si hay adjunto, se usa como caption) */}
          <Input
            type="text"
            placeholder={composeMedia ? "Añade un pie de foto…" : "Escribe un mensaje..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            className="pl-10 pr-12 h-11 bg-white dark:bg-gray-800 dark:text-white rounded-lg border-none w-full"
          />

          {/* Enviar */}
          <Button
            onClick={() => void sendNow()}
            size="icon"
            className="absolute right-1 rounded-full bg-blue-500 hover:bg-blue-600"
            aria-label="Enviar"
            type="button"
          >
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatMain;
