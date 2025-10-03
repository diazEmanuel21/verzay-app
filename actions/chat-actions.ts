'use server';

import type { ApiKey } from '@prisma/client';

/* ==================================
 1. Tipos de Datos (Exportados)
 ================================== */

// 1.1. Tipos para Contenido Multimedia
// Define la estructura común para los objetos de mensaje multimedia anidados
type MediaMessagePayload = {
    url?: string;
    mediaUrl?: string; // 🔑 URL de Evolution (a menudo está en el nivel superior de 'message', pero se incluye aquí por si la API la anida)
    mediaKey?: string;
    mimetype?: string;
    fileLength?: string | number;
    fileSha256?: string;
    fileEncSha256?: string;
    jpegThumbnail?: string; // Para imágenes y videos
    width?: number;
    height?: number;
    seconds?: number; // Para audio y video
    ptt?: boolean; // Para audio
    caption?: string; // Título o descripción del contenido
    // ... otros campos específicos de WhatsApp
};

// 1.2. Estructura del campo 'message'
// Unifica todos los posibles subtipos de mensaje
export type MessageContent = {
    conversation?: string;
    extendedTextMessage?: { text: string };
    
    // 🔑 Claves para Multimedia, usando el tipo MediaMessagePayload
    imageMessage?: MediaMessagePayload; 
    documentMessage?: MediaMessagePayload;
    videoMessage?: MediaMessagePayload; // 👈 AGREGADO: Para Video
    audioMessage?: MediaMessagePayload; // 👈 AGREGADO: Para Audio

    // 🔑 La URL de descarga directa (y pre-firmada) que Evolution a menudo proporciona en este nivel
    mediaUrl?: string; 

    messageContextInfo?: Record<string, unknown>;
};

// 1.3. Definición de EvolutionMessage (Actualizada)
export type EvolutionMessage = {
    id?: string;
    key?: { id?: string; fromMe?: boolean; remoteJid?: string; senderLid?: string };
    pushName?: string | null;
    participant?: string | null;
    messageType?: string; // Ej: 'conversation', 'imageMessage', 'videoMessage', 'audioMessage'
    message: MessageContent; // 🔑 Usa el tipo detallado 'MessageContent'
    contextInfo?: Record<string, unknown> | null;
    source?: string;
    messageTimestamp?: number;
    instanceId?: string;
    sessionId?: string | null;
    status?: string;
    MessageUpdate?: Array<any>; // Para manejar las actualizaciones de estado (READ, DELIVERED, etc.)
};

// 1.4. Tipos para LastMessage (Actualizado)
export type LastMessage = {
    id: string | null;
    key: { id: string; fromMe: boolean; remoteJid: string; senderLid?: string };
    pushName: string | null;
    participant: string | null;
    messageType: string;
    message: MessageContent; // 🔑 Usa el tipo detallado 'MessageContent'
    contextInfo: Record<string, unknown> | null;
    source: string;
    messageTimestamp: number;
    instanceId: string;
    sessionId: string | null;
    status: string;
};

// 🔑 Definición COMPLETA de ChatData
export type ChatData = { 
    id: string | null;
    remoteJid: string;
    pushName: string | null;
    profilePicUrl: string | null;
    updatedAt?: string;
    windowStart?: string;
    windowExpires?: string;
    windowActive?: boolean;
    lastMessage: LastMessage | null;
    unreadCount: number;
    isSaved?: number | boolean;
};

type ChatArray = ChatData[];

export type FetchChatsResult =
    | { success: true; message: string; data: ChatArray }
    | { success: false; message: string };

export type FindMessagesResult =
    | {
        success: true;
        message: string;
        data: EvolutionMessage[];
        total?: number;
        pages?: number;
        currentPage?: number;
        nextPage?: number | null;
        raw?: unknown;
        queriedRemoteJid?: string;
    }
    | { success: false; message: string; raw?: unknown; queriedRemoteJid?: string };

// Nuevo tipo para el resultado del envío de mensaje
export type SendMessageResult =
    | { success: true; message: string; data?: unknown; remoteJid: string }
    | { success: false; message: string; raw?: unknown; remoteJid: string };


/* ==================================
 2. Utilidades Comunes
 ================================== */

function normalizeBaseUrl(url: string): string {
    const trimmed = (url || '').trim().replace(/\/+$/, '');
    if (!/^https?:\/\//i.test(trimmed)) return `https://${trimmed}`;
    return trimmed;
}

function isChatData(x: any): x is ChatData {
    return x && typeof x === 'object' && typeof x.remoteJid === 'string' && typeof x.unreadCount !== 'undefined';
}

function ensureArrayResponse(payload: unknown): ChatArray {
    const arr =
        (Array.isArray(payload) && payload) ||
        (typeof payload === 'object' && payload !== null && (Array.isArray((payload as any).data) ? (payload as any).data : Array.isArray((payload as any).chats) ? (payload as any).chats : null));
    if (!arr || !Array.isArray(arr)) return [];
    return arr.filter(isChatData) as ChatArray;
}

function normalizeFindMessagesPayload(payload: any) {
    // Manejo de la estructura 'messages.records'
    if (payload?.messages?.records && Array.isArray(payload.messages.records)) {
        const container = payload.messages;
        return {
            items: container.records as EvolutionMessage[],
            meta: {
                total: Number(container.total ?? 0) || undefined,
                pages: Number(container.pages ?? 0) || undefined,
                currentPage: Number(container.currentPage ?? 1) || undefined,
                nextPage: (container.currentPage < container.pages ? container.currentPage + 1 : null) ?? undefined,
            },
        };
    }
    // Manejo de la estructura de array simple o 'data'
    const items = (Array.isArray(payload) && payload) || (payload?.data && Array.isArray(payload.data) && payload.data) || [];
    return { items: items as EvolutionMessage[], meta: {} };
}

async function doRequest(
    url: string,
    apikeyHeader: string,
    signal: AbortSignal,
    method: 'POST' | 'GET',
    bodyObj?: Record<string, any>
) {
    return fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            apikey: apikeyHeader,
        },
        body: method === 'POST' ? JSON.stringify(bodyObj ?? {}) : undefined,
        cache: 'no-store',
        signal,
    });
}

/* ==================================
 3. Acciones del Servidor
 ================================== */

export async function fetchChatsFromEvolution(
    apiKeyData: Pick<ApiKey, 'url' | 'key'>,
    instanceName: string,
    options?: { timeoutMs?: number; allowInsecureTLS?: boolean; path?: 'findChats'; }
): Promise<FetchChatsResult> {
    const { url: baseUrlRaw, key: globalApiKey } = apiKeyData;
    if (!baseUrlRaw || !globalApiKey || !instanceName) {
        return { success: false, message: 'Parámetros de conexión faltantes.' };
    }

    const baseURL = normalizeBaseUrl(baseUrlRaw);
    const endpointUrl = `${baseURL}/chat/findChats/${encodeURIComponent(instanceName)}`;
    const apikeyHeader = globalApiKey;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options?.timeoutMs ?? 15000);

    try {
        let response = await doRequest(endpointUrl, apikeyHeader, controller.signal, 'POST');
        if (!response.ok && (response.status === 404 || response.status === 405)) {
            response = await doRequest(endpointUrl, apikeyHeader, controller.signal, 'GET');
        }
        clearTimeout(timeout);

        const raw = await response.json().catch(() => null);

        if (!response.ok) {
            const apiMsg = (raw?.message as string) || `Error ${response.status} en la API.`;
            return { success: false, message: apiMsg };
        }
        
        if (raw == null) return { success: false, message: 'Respuesta inválida o vacía.' };

        const data = ensureArrayResponse(raw);
        return { success: true, message: `OK findChats ${instanceName}`, data };

    } catch (err: any) {
        clearTimeout(timeout);
        const errMsg = err?.name === 'AbortError' ? 'Timeout de solicitud.' : `Error de red: ${err?.message || String(err)}`;
        return { success: false, message: errMsg };
    }
}

export async function findMessagesByRemoteJid(
    apiKeyData: Pick<ApiKey, 'url' | 'key'>,
    instanceName: string,
    remoteJid: string,
    options?: {
        timeoutMs?: number;
        page?: number;
        pageSize?: number;
        limit?: number;
    }
): Promise<FindMessagesResult> {
    const { url: baseUrlRaw, key: globalApiKey } = apiKeyData;
    
    if (!baseUrlRaw || !globalApiKey || !instanceName || !remoteJid) {
        return { success: false, message: 'URL / API Key / instanceName / remoteJid faltantes.', queriedRemoteJid: remoteJid };
    }

    const baseURL = normalizeBaseUrl(baseUrlRaw);
    const endpointUrl = `${baseURL}/chat/findMessages/${encodeURIComponent(instanceName)}`;
    const apikeyHeader = globalApiKey;

    const payload: Record<string, any> = {
        where: {
            key: {
                remoteJid: remoteJid,
            },
        },
    };

    if (options?.page) {
        payload.page = options.page;
    }
    // NOTA: Evolution usa 'offset' para el tamaño de la página o límite, ajustamos aquí:
    if (options?.pageSize) {
        payload.offset = options.pageSize; 
    } else if (options?.limit) {
        payload.offset = options.limit; 
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options?.timeoutMs ?? 15000);

    try {
        const response = await doRequest(endpointUrl, apikeyHeader, controller.signal, 'POST', payload);
        clearTimeout(timeout);

        const raw = await response.json().catch(() => null);

        if (!response.ok) {
            const apiMsg = (raw?.message as string) || `Error ${response.status} en la API.`;
            return { success: false, message: apiMsg, raw, queriedRemoteJid: remoteJid };
        }
        
        if (raw == null) return { success: false, message: 'Respuesta inválida o vacía.', queriedRemoteJid: remoteJid };
        
        const { items, meta } = normalizeFindMessagesPayload(raw);

        return {
            success: true,
            message: `OK findMessages ${instanceName} ${remoteJid}`,
            data: items,
            total: meta.total,
            pages: meta.pages,
            currentPage: meta.currentPage,
            nextPage: meta.nextPage,
            raw,
            queriedRemoteJid: remoteJid,
        };
    } catch (err: any) {
        clearTimeout(timeout);
        const errMsg = err?.name === 'AbortError' ? 'Timeout de solicitud.' : `Error de red: ${err?.message || String(err)}`;
        return { success: false, message: errMsg, queriedRemoteJid: remoteJid };
    }
}


export async function sendTextMessage(
    apiKeyData: Pick<ApiKey, 'url' | 'key'>,
    instanceName: string,
    remoteJid: string,
    textMessage: string,
    options?: {
        timeoutMs?: number;
        delay?: number;
        quotedMessage?: { key: { id: string }; message: { conversation: string } };
        linkPreview?: boolean;
        mentionsEveryOne?: boolean;
        mentioned?: string[];
    }
): Promise<SendMessageResult> {
    const { url: baseUrlRaw, key: globalApiKey } = apiKeyData;
    
    if (!baseUrlRaw || !globalApiKey || !instanceName || !remoteJid || !textMessage) {
        return { success: false, message: 'Parámetros de conexión faltantes (URL, API Key, instanceName, remoteJid, o textMessage).', remoteJid };
    }

    const baseURL = normalizeBaseUrl(baseUrlRaw);
    const endpointUrl = `${baseURL}/message/sendText/${encodeURIComponent(instanceName)}`;
    const apikeyHeader = globalApiKey;

    const payload: Record<string, any> = {
        number: remoteJid,
        text: textMessage,
    };

    if (options?.delay) payload.delay = options.delay;
    if (options?.quotedMessage) payload.quoted = options.quotedMessage;
    if (options?.linkPreview !== undefined) payload.linkPreview = options.linkPreview;
    if (options?.mentionsEveryOne !== undefined) payload.mentionsEveryOne = options.mentionsEveryOne;
    if (options?.mentioned && options.mentioned.length > 0) payload.mentioned = options.mentioned;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options?.timeoutMs ?? 15000);

    try {
        const response = await doRequest(endpointUrl, apikeyHeader, controller.signal, 'POST', payload);
        clearTimeout(timeout);

        const raw = await response.json().catch(() => null);

        if (!response.ok) {
            const apiMsg = (raw?.message as string) || `Error ${response.status} en la API al enviar mensaje.`;
            return { success: false, message: apiMsg, raw, remoteJid };
        }
        
        if (raw == null) return { success: false, message: 'Respuesta inválida o vacía al enviar mensaje.', remoteJid };
        
        return {
            success: true,
            message: `Mensaje enviado OK a ${remoteJid}`,
            data: raw,
            remoteJid: remoteJid,
        };
    } catch (err: any) {
        clearTimeout(timeout);
        const errMsg = err?.name === 'AbortError' ? 'Timeout de solicitud.' : `Error de red: ${err?.message || String(err)}`;
        return { success: false, message: errMsg, remoteJid };
    }
}