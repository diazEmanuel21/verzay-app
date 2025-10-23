'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRight, Mic, Send, Trash2, X, Clock, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    AttachmentMenu,
    type ComposeMedia,
    type MediaType,
} from './attachment-menu';

/* -------- Outgoing payload unificado -------- */
export type OutgoingTextPayload = {
    kind: 'text';
    text: string;
    delay?: number;
    linkPreview?: boolean;
    mentionsEveryOne?: boolean;
    mentioned?: string[];
    quotedMessage?: { key: { id: string }; message: { conversation: string } };
};
export type OutgoingMediaPayload = {
    kind: 'media';
    mediatype: MediaType;
    mediaUrl: string; // ✅ Base64 PURO (para audio) o Data URL (para adjuntos)
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

/* -------- Evolution / UI Tipos Básicos -------- */
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
    total?: number;
    pages?: number;
    currentPage?: number;
    nextPage?: number | null;
    instanceName?: string;
    remoteJid?: string;
};
export type MediaData = { type: MediaType; url: string; mimeType: string; caption?: string };
type UIBubble = {
    id: string;
    sender: 'user' | 'other';
    content: string;
    avatarSrc?: string;
    ts?: number;
    media?: MediaData;
    status?: 'sending'; // Nuevo estado para el esqueleto
};

type ChatMainProps = {
    header: ChatHeader;
    messages: EvolutionMessage[];
    info?: ChatInfoMeta;
    loading?: boolean;
    onSend: (payload: OutgoingMessagePayload) => void | Promise<void>;
};

// Nuevo tipo de estado para la previsualización del audio
type RecordedAudioData = {
    base64Pure: string; // Base64 PURO para el payload de envío
    dataUrlWithPrefix: string; // Data URL completa para el reproductor del cliente
    mimetype: string;
    durationSecs: number;
};

/* -------- Helpers de formateo y conversión -------- */

function two(n: number) {
    return n.toString().padStart(2, '0');
}

/**
 * Convierte Blob a Base64 PURO (sin el prefijo 'data:mime/type;base64,').
 * Es la clave para enviar "datos crudos" al backend.
 */
function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('Error leyendo blob'));
        reader.onloadend = () => {
            const dataUrl = reader.result as string;
            const commaIndex = dataUrl.indexOf(',');
            if (commaIndex === -1) {
                reject(new Error('Formato de Data URL inválido.'));
                return;
            }
            resolve(dataUrl.substring(commaIndex + 1)); // Base64 PURO
        };
        reader.readAsDataURL(blob);
    });
}

function extractMediaInfo(msg: any, type: MediaType): MediaData | null {
    const typeKey = `${type}Message`;
    const mediaObj = msg[typeKey] || {};
    const url = msg.mediaUrl || mediaObj.mediaUrl || mediaObj.url;
    const mimeType = mediaObj.mimetype || 'unknown/mime';
    const caption = mediaObj.caption;
    if (url) return { type, url, mimeType, caption: caption || undefined };
    return null;
}

function toUIMessages(messages: EvolutionMessage[], userJid: string | undefined, avatarUrl: string | undefined): UIBubble[] {
    return messages.map((m) => {
        const isUser = m.key?.fromMe === true || m.key?.remoteJid !== userJid;
        const sender: 'user' | 'other' = isUser ? 'user' : 'other';
        const ts = m.messageTimestamp;
        let content = '';
        let media: MediaData | null = null;
        const messageData = m.message as any;

        if (m.messageType === 'conversation' && messageData?.conversation) content = messageData.conversation as string;
        else if (m.messageType === 'extendedTextMessage' && messageData?.extendedTextMessage?.text)
            content = messageData.extendedTextMessage.text as string;
        else if (m.messageType === 'imageMessage') {
            media = extractMediaInfo(messageData, 'image');
            content = media?.caption || '';
        } else if (m.messageType === 'videoMessage') {
            media = extractMediaInfo(messageData, 'video');
            content = media?.caption || '';
        } else if (m.messageType === 'audioMessage') {
            media = extractMediaInfo(messageData, 'audio');
            content = '';
        } else if (m.messageType === 'documentMessage') {
            media = extractMediaInfo(messageData, 'document');
            content = media?.caption || '';
        } else content = `[Mensaje ${m.messageType || 'desconocido'}]`;

        return {
            id: m.id || String(ts) + (m.key?.id || ''),
            sender,
            content,
            avatarSrc: sender === 'user' ? '/default.png' : avatarUrl,
            ts: ts ? ts * 1000 : undefined,
            media: media || undefined,
        };
    });
}

/* -------- Subcomponentes de UI -------- */

// NUEVO: Componente de texto expandible
const ExpandableText: React.FC<{ message: string; isUserMessage: boolean }> = ({ message, isUserMessage }) => {
    const MAX_LENGTH = 250; // Límite de caracteres para "ver más"
    const [isExpanded, setIsExpanded] = useState(false);

    if (message.length <= MAX_LENGTH) {
        return <p className="text-sm whitespace-pre-wrap">{message}</p>;
    }

    const displayedText = isExpanded ? message : `${message.substring(0, MAX_LENGTH)}...`;
    const linkClass = isUserMessage ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300';

    return (
        <p className="text-sm whitespace-pre-wrap">
            {displayedText}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={cn('ml-1 font-semibold text-xs inline-block', linkClass)}
                type="button"
            >
                {isExpanded ? 'Ver menos' : 'Ver más...'}
            </button>
        </p>
    );
};

// NUEVO: Componente de esqueleto de mensaje (Enviando...)
const SendingMessageSkeleton: React.FC<{ tempMessage: UIBubble }> = ({ tempMessage }) => {
    const isMedia = tempMessage.media !== undefined;
    const bubbleClass = 'bg-gray-300/50 dark:bg-gray-700/50 text-gray-500 rounded-xl rounded-br-sm self-end animate-pulse';

    return (
        <div className="flex items-end gap-1 my-1 justify-end opacity-70">
            <div className={cn('p-2 break-words shadow-sm relative inline-block max-w-[90%] sm:max-w-[70%]', bubbleClass)}>
                {isMedia ? (
                    <div className="w-24 h-24 rounded-md bg-gray-400/50 dark:bg-gray-600/50 my-1" />
                ) : (
                    <>
                        <div className="h-3 w-48 bg-gray-400/50 dark:bg-gray-600/50 rounded mb-1" />
                        <div className="h-3 w-32 bg-gray-400/50 dark:bg-gray-600/50 rounded" />
                    </>
                )}
                <div className="text-[0.6rem] mt-1 flex justify-end items-center gap-1 text-gray-500/70">
                    <Clock className="w-3 h-3 text-white" />
                    <span>Enviando...</span>
                </div>
            </div>
        </div>
    );
};

const MediaRenderer: React.FC<{ media: MediaData | undefined }> = React.memo(({ media }) => {
    if (!media) return null;
    const { type, url, mimeType, caption } = media;
    const baseStyle = 'my-1 rounded-md overflow-hidden border dark:border-gray-600';
    const audioDocStyle = 'w-full max-w-[350px]';

    return (
        <div
            className={cn(
                baseStyle,
                'max-w-full',
                type === 'audio' || type === 'document' ? audioDocStyle : 'md:max-w-[300px]'
            )}
        >
            {type === 'image' && (
                <img
                    src={url}
                    alt={caption || 'Imagen'}
                    className="w-full h-auto object-cover max-h-[300px] cursor-pointer"
                    onClick={() => window.open(url, '_blank')}
                />
            )}
            {type === 'video' && <video src={url} controls className="w-full h-auto max-h-[300px] bg-black" poster={caption} />}
            {type === 'audio' && (
                <div className="p-2 bg-white dark:bg-gray-700 flex items-center border-t dark:border-gray-600">
                    <Mic className="w-5 h-5 text-gray-500 dark:text-gray-300 mr-2 flex-shrink-0" />
                    <audio src={url} controls className="flex-1 h-8" />
                </div>
            )}
            {type === 'document' && (
                <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-blue-500 text-white flex items-center justify-between hover:bg-blue-600 transition"
                >
                    <span className="truncate">{caption || mimeType}</span>
                    <ArrowRight className="w-4 h-4" />
                </a>
            )}
            {caption && type !== 'audio' && (
                <div
                    className={cn(
                        'text-xs p-1',
                        type === 'document' ? 'text-gray-600 dark:text-gray-300' : 'text-gray-800 dark:text-gray-100'
                    )}
                >
                    
                </div>
            )}
        </div>
    );
});
MediaRenderer.displayName = 'MediaRenderer';

const MessageBubble: React.FC<{
    message: string;
    isUserMessage: boolean;
    avatarSrc?: string;
    timestamp?: number;
    media?: MediaData;
    status?: 'sending';
}> = ({ message, isUserMessage, avatarSrc, timestamp, media, status }) => {
    const bubbleClass = isUserMessage
        ? 'bg-primary text-white rounded-xl rounded-br-sm self-end'
        : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-xl rounded-tl-sm self-start';
    const contentClass = isUserMessage ? 'text-white' : 'text-gray-800 dark:text-gray-100';
    const showAvatar = !isUserMessage;

    return (
        <div className={cn('flex items-end gap-1 my-1 ', isUserMessage ? 'justify-end' : 'justify-start')}>
            {showAvatar && (
                <div className="mr-1">
                    <Avatar className="w-7 h-7">
                        <AvatarImage src={avatarSrc || '/default-avatar.png'} />
                        <AvatarFallback>E</AvatarFallback>
                    </Avatar>
                </div>
            )}
            <div
                className={cn(
                    'p-2 break-words shadow-sm relative inline-block max-w-[90%] sm:max-w-[70%]',
                    bubbleClass
                )}
            >
                {media && <MediaRenderer media={media} />}
                {message && (
                    <div className={cn(contentClass, 'pr-10')}>
                        <ExpandableText message={message} isUserMessage={isUserMessage} />
                    </div>
                )}
                {/* Marcador de tiempo y estado */}
                <div className={cn('right-2 bottom-1 flex items-center gap-1')}>
                    {timestamp && (
                        <span
                            className={cn(
                                'text-[0.6rem] mt-1 block',
                                isUserMessage ? 'text-gray-300' : 'text-gray-500 dark:text-gray-400/80'
                            )}
                        >
                            {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    )}
                    {isUserMessage && (
                        <span className="text-[0.6rem] mt-1 block">
                            {status === 'sending' ? (
                                <Clock className="w-3 h-3 text-gray-300" />
                            ) : (
                                // Asume "Enviado/Leído" si no es 'sending'
                                <Check className="w-3 h-3 text-gray-300" />
                            )}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

const ChatMessageList: React.FC<{
    uiMessages: UIBubble[];
    loading?: boolean;
    listRef: React.RefObject<HTMLDivElement>;
    tempMessage: UIBubble | null; // Nuevo: Mensaje temporal
}> = ({ uiMessages, loading, listRef, tempMessage }) => {
    // Unir el mensaje temporal (si existe) a la lista
    const fullList = useMemo(() => {
        const list = [...uiMessages];
        if (tempMessage) {
            // El mensaje temporal siempre va al final
            list.push(tempMessage);
        }
        return list;
    }, [uiMessages, tempMessage]);

    return (
        <div className="flex-1 overflow-y-auto p-4 flex flex-col custom-scrollbar w-full" ref={listRef}>
            {loading && <div className="text-center text-gray-500 py-4">Cargando mensajes…</div>}
            {fullList.map((msg) =>
                msg.status === 'sending' ? (
                    <SendingMessageSkeleton key={msg.id} tempMessage={msg} />
                ) : (
                    <MessageBubble
                        key={msg.id}
                        message={msg.content}
                        isUserMessage={msg.sender === 'user'}
                        avatarSrc={msg.avatarSrc}
                        timestamp={msg.ts}
                        media={msg.media}
                    />
                )
            )}
        </div>
    );
};

/* -------- Componente principal -------- */
export const ChatMain: React.FC<ChatMainProps> = ({ header, messages, info, loading, onSend }) => {
    const [input, setInput] = useState('');
    const [composeMedia, setComposeMedia] = useState<ComposeMedia | null>(null);
    const [isSending, setIsSending] = useState(false); // NUEVO: Estado de envío
    const [tempMessage, setTempMessage] = useState<UIBubble | null>(null); // NUEVO: Mensaje esqueleto
    const listRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const userJid = info?.remoteJid;

    // Estados de Grabación de Audio
    const [isRecording, setIsRecording] = useState(false);
    const [recordSecs, setRecordSecs] = useState(0);
    const [recordedAudio, setRecordedAudio] = useState<RecordedAudioData | null>(null);

    const mediaStreamRef = useRef<MediaStream | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<BlobPart[]>([]);
    const timerRef = useRef<number | null>(null);

    const uiMessages = useMemo(
        () => toUIMessages(messages.slice().reverse(), userJid, header.avatarSrc),
        [messages, userJid, header.avatarSrc]
    );

    // ** LÓGICA DE SCROLL (EL CAMBIO CLAVE) **
    const scrollToBottom = useCallback(() => {
        if (listRef.current) {
            listRef.current.scrollTop = listRef.current.scrollHeight;
        }
    }, []);

    useEffect(() => {
        // Ejecutar scroll cada vez que cambia la lista de mensajes confirmados o se agrega el esqueleto
        scrollToBottom();
    }, [uiMessages.length, tempMessage, scrollToBottom]);
    // ****************************************

    // Auto-resize del Textarea
    useEffect(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = Math.min(el.scrollHeight, 160) + 'px'; // 160px ≈ max-h-40
    }, [input]);

    /* -------- Handlers de UI -------- */
    const handleComposeMediaChange = useCallback((m: ComposeMedia | null) => {
        setComposeMedia(m);
        if (m) {
            setInput(m.fileName || '');
        }
    }, []);

    const clearComposeMedia = useCallback(() => setComposeMedia(null), []);

    const stopTimer = () => {
        if (timerRef.current) {
            window.clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    const startTimer = () => {
        stopTimer();
        setRecordSecs(0);
        timerRef.current = window.setInterval(() => {
            setRecordSecs((s) => s + 1);
        }, 1000) as unknown as number;
    };

    const formatSecs = (s: number) => `${two(Math.floor(s / 60))}:${two(s % 60)}`;

    const stopMicrophoneStream = useCallback(() => {
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach((t) => t.stop());
            mediaStreamRef.current = null;
        }
    }, []);

    /* -------- Lógica de Envío -------- */
    const sendNow = useCallback(async () => {
        let payload: OutgoingMessagePayload | null = null;
        let content = '';
        let media: MediaData | undefined = undefined;

        // --- 1. Determinar Payload y Contenido Temporal ---
        if (recordedAudio) {
            // Envío de Audio Grabado (PTT)
            payload = {
                kind: 'media',
                mediatype: 'audio',
                mediaUrl: recordedAudio.base64Pure,
                mimetype: recordedAudio.mimetype,
                ptt: true,
            };
            content = '';
            media = {
                type: 'audio',
                url: recordedAudio.dataUrlWithPrefix,
                mimeType: recordedAudio.mimetype,
            };

            setRecordedAudio(null);
        } else if (composeMedia) {
            // Envío de Media Adjunta
            const caption = input && input.trim() ? input.trim() : composeMedia.fileName;
            payload = {
                kind: 'media',
                mediatype: composeMedia.mediatype,
                mediaUrl: composeMedia.dataUrl, // Data URL completa para adjuntos
                mimetype: composeMedia.mimeType,
                fileName: composeMedia.fileName,
                caption: caption,
            };
            content = caption || '';
            media = {
                type: composeMedia.mediatype,
                url: composeMedia.dataUrl,
                mimeType: composeMedia.mimeType,
                caption: caption,
            };

            setInput('');
            setComposeMedia(null);
        } else {
            // Envío de Texto
            const text = input.trim();
            if (!text) return; // No enviar si es solo espacio
            payload = { kind: 'text', text };
            content = text;

            setInput('');
        }

        // --- 2. Mostrar Esqueleto y Enviar ---
        if (payload) {
            // Crear y mostrar mensaje temporal/esqueleto
            const tempMsg: UIBubble = {
                id: `temp-${Date.now()}`,
                sender: 'user',
                content,
                avatarSrc: '/user-avatar.png',
                ts: Date.now(),
                media,
                status: 'sending', // Marcar como esqueleto
            };
            setTempMessage(tempMsg);
            setIsSending(true);

            try {
                await onSend(payload);
                // El backend debe disparar la obtención de mensajes que reemplazará el esqueleto
            } catch (error) {
                console.error('Error al enviar mensaje:', error);
                // Opcional: Mostrar error o dejar el esqueleto con un ícono de fallo
            } finally {
                // Limpiar el esqueleto SÓLO después de que la respuesta del servidor haya llegado
                // y los mensajes hayan sido actualizados (lo cual debe suceder en tu componente padre)
                setIsSending(false);
                setTempMessage(null);
            }
        }
    }, [recordedAudio, composeMedia, input, onSend]);

    const handleKeyPress = useCallback(
        (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
            // Solo permite enviar si no estamos grabando, previsualizando audio, o enviando
            if (!isRecording && !recordedAudio && !isSending && e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void sendNow();
            }
        },
        [sendNow, isRecording, recordedAudio, isSending]
    );

    /* -------- Lógica de Grabación de Audio -------- */
    const stopRecordingAndPreview = useCallback(() => {
        // Detener la grabadora para disparar rec.onstop
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
    }, []);

    const cancelRecording = useCallback(() => {
        stopTimer();
        setIsRecording(false);
        audioChunksRef.current = [];
        setRecordedAudio(null); // Limpiar previsualización
        if (mediaRecorderRef.current) {
            try {
                if (mediaRecorderRef.current.state !== 'inactive') mediaRecorderRef.current.stop();
            } catch { }
            mediaRecorderRef.current = null;
        }
        stopMicrophoneStream(); // Liberar recurso del micrófono
    }, [stopMicrophoneStream]);

    const startRecording = useCallback(async () => {
        if (isSending) return; // No grabar si estamos enviando
        cancelRecording(); // Limpiar cualquier estado anterior y previsualización

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            const mimeCandidates = [
                'audio/webm;codecs=opus',
                'audio/ogg;codecs=opus',
                'audio/webm',
                'audio/ogg',
            ];
            const mimeType = mimeCandidates.find((m) => MediaRecorder.isTypeSupported(m)) || '';

            const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

            audioChunksRef.current = [];
            rec.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            rec.onstart = () => {
                setIsRecording(true);
                startTimer();
            };

            rec.onstop = async () => {
                stopTimer();
                setIsRecording(false);
                mediaRecorderRef.current = null;

                const finalMimeType = rec.mimeType || 'audio/webm';
                const blob = new Blob(audioChunksRef.current, { type: finalMimeType });
                audioChunksRef.current = [];

                if (blob.size === 0) {
                    console.warn('Grabación vacía. Cancelando.');
                    stopMicrophoneStream();
                    return;
                }

                // ✅ CONVERSIÓN CRÍTICA: Base64 PURO para envío
                const base64Pure = await blobToBase64(blob);

                // Data URL COMPLETA para el reproductor en el cliente (necesita el prefijo)
                const dataUrlWithPrefix = `data:${finalMimeType};base64,${base64Pure}`;

                setRecordedAudio({
                    base64Pure,
                    dataUrlWithPrefix,
                    mimetype: finalMimeType,
                    durationSecs: recordSecs,
                });

                stopMicrophoneStream(); // Detener el stream después de crear la Data
            };

            rec.start();
            mediaRecorderRef.current = rec;
        } catch (err) {
            console.error('Error al iniciar grabación (permiso denegado):', err);
            cancelRecording(); // Limpiar todo si falla la inicialización
        }
    }, [cancelRecording, recordSecs, stopMicrophoneStream, isSending]);

    /* -------- Efectos y UI State -------- */
    useEffect(() => {
        return () => {
            // Cleanup en desmontaje
            cancelRecording();
        };
    }, [cancelRecording]);

    const isPreviewingAudio = recordedAudio !== null && !isRecording;
    const isInputActive = !isRecording && !isPreviewingAudio && !isSending;
    const isSendButtonVisible = isInputActive && (input.trim() || composeMedia);

    return (
        <div className="flex flex-col h-full w-full bg-white dark:bg-gray-800 border-l border-r">
            {/* Header */}
            <div className="flex items-center justify-between p-2 border-b dark:border-gray-700 shadow-md bg-white dark:bg-gray-800 z-10">
                <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                        <AvatarImage src={header.avatarSrc || '/default-avatar.png'} />
                        <AvatarFallback>{header.name?.charAt(0) ?? '?'}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-semibold text-md dark:text-white">{header.name}</p>
                    </div>
                </div>
            </div>

            {/* Mensajes */}
            <ChatMessageList
                uiMessages={uiMessages}
                loading={loading}
                listRef={listRef}
                tempMessage={tempMessage} // Pasar el mensaje esqueleto
            />

            {/* Barra de mensaje */}
            <div className="p-3 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900">

                {/* Previsualización de adjuntos de archivo (Imágenes/Archivos) */}
                {composeMedia && (
                    <div className="mb-2 flex items-center gap-2">
                        {composeMedia.mediatype === 'image' ? (
                            <div className="relative w-16 h-16 rounded-md overflow-hidden border bg-white dark:bg-gray-800">
                                <img
                                    src={composeMedia.dataUrl}
                                    alt={composeMedia.fileName}
                                    className="w-full h-full object-cover"
                                />
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

                {/* Indicador de Grabación de Audio */}
                {isRecording && (
                    <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm">
                            <div className="flex items-center gap-2 rounded-full px-3 py-1 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
                                <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                <span className="font-medium">Grabando…</span>
                                <span className="tabular-nums">{formatSecs(recordSecs)}</span>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-700"
                            onClick={cancelRecording}
                            title="Cancelar grabación"
                            type="button"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                )}

                {/* Previsualización de Audio Grabado */}
                {isPreviewingAudio && recordedAudio && (
                    <div className="flex items-center gap-2 p-2 mb-2 rounded-lg bg-gray-100 dark:bg-gray-700 border dark:border-gray-600">
                        <Button
                            onClick={cancelRecording}
                            size="icon"
                            className="rounded-full bg-red-500 hover:bg-red-600 flex-shrink-0"
                            title="Borrar nota de voz"
                            type="button"
                        >
                            <Trash2 className="w-5 h-5" />
                        </Button>

                        {/* Usar la Data URL CON PREFIJO para el reproductor nativo */}
                        <audio src={recordedAudio.dataUrlWithPrefix} controls className="flex-1 h-8" />

                        <span className="text-sm tabular-nums text-gray-600 dark:text-gray-300 flex-shrink-0">
                            {formatSecs(recordedAudio.durationSecs)}
                        </span>

                        <Button
                            onClick={() => void sendNow()}
                            size="icon"
                            className="rounded-full bg-green-500 hover:bg-green-600 flex-shrink-0"
                            title="Enviar nota de voz"
                            type="button"
                        >
                            <Send className="w-5 h-5 text-white" />
                        </Button>
                    </div>
                )}

                {/* Área de Input y Botones */}
                <div className="relative flex items-end">
                    {/* Menu de Adjuntos */}
                    <div className="absolute left-1 z-10 bottom-2">
                        {isInputActive && <AttachmentMenu onComposeMediaChange={handleComposeMediaChange} maxBase64MB={8} />}
                    </div>

                    {/* Textarea multilínea con auto-resize */}
                    <Textarea
                        ref={textareaRef}
                        placeholder={composeMedia ? 'Añade un pie de foto…' : 'Escribe un mensaje...'}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyPress}
                        disabled={!isInputActive}
                        rows={1}
                        className={cn(
                            'min-h-[44px] max-h-40 h-auto bg-white dark:bg-gray-800 dark:text-white rounded-lg border-none w-full',
                            'pl-10 pr-24 resize-none overflow-y-auto',
                            !isInputActive && 'opacity-0 pointer-events-none'
                        )}
                    />

                    {/* Controles de Audio y Envío */}
                    <div className="absolute right-1 flex items-center gap-1 bottom-2">
                        {/* Botón de Micrófono/Detener (Activo solo si no hay previsualización o envío en curso) */}
                        {!isPreviewingAudio && !isSending && (
                            <Button
                                onClick={() => (isRecording ? stopRecordingAndPreview() : startRecording())}
                                size="icon"
                                className={cn(
                                    'rounded-full',
                                    isRecording
                                        ? 'bg-red-500 hover:bg-red-600'
                                        : 'bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600'
                                )}
                                aria-label={isRecording ? 'Detener grabación' : 'Grabar audio'}
                                title={isRecording ? 'Detener y previsualizar' : 'Grabar nota de voz'}
                                type="button"
                            >
                                <Mic className={cn('w-5 h-5', isRecording ? 'text-white' : 'text-black dark:text-white')} />
                            </Button>
                        )}

                        {/* Botón de Enviar (Solo si hay texto o media adjunta, pero no audio grabado) */}
                        {isSendButtonVisible && !isSending && (
                            <Button
                                onClick={() => void sendNow()}
                                size="icon"
                                className="rounded-full bg-blue-500 hover:bg-blue-600"
                                aria-label="Enviar"
                                type="button"
                            >
                                <ArrowRight className="w-5 h-5 text-white" />
                            </Button>
                        )}

                        {/* Indicador de envío (reemplaza el botón de enviar mientras se está enviando) */}
                        {isSending && (
                            <div className="p-2 bg-blue-500 rounded-full animate-spin">
                                <Clock className="w-5 h-5 text-white" />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatMain;