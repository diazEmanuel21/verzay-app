'use server';

import type { ApiKey } from '@prisma/client';

/* ==================================
  1. Tipos de Datos (Exportados)
  ... (mantener todos los tipos de datos como están)
  ================================== */
type LastMessage = {
  id: string | null;
  key: { id: string; fromMe: boolean; remoteJid: string };
  pushName: string | null;
  participant: string | null;
  messageType: string;
  message: {
    conversation?: string;
    imageMessage?: Record<string, unknown>;
    documentMessage?: Record<string, unknown>;
    messageContextInfo?: Record<string, unknown>;
  };
  contextInfo: Record<string, unknown> | null;
  source: string;
  messageTimestamp: number;
  instanceId: string;
  sessionId: string | null;
  status: string;
};

// 🔑 CORRECCIÓN: Definición COMPLETA de ChatData para evitar errores de Missing Properties
export type ChatData = { 
  id: string | null;
  remoteJid: string;
  pushName: string | null;
  profilePicUrl: string | null;
  updatedAt?: string;
  windowStart?: string;
  windowExpires?: string;
  windowActive?: boolean;
  lastMessage: LastMessage | null; // Requerido por el error
  unreadCount: number; // Requerido por el error
  isSaved?: number | boolean;
};

type ChatArray = ChatData[];

export type FetchChatsResult =
  | { success: true; message: string; data: ChatArray }
  | { success: false; message: string };

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

/* ==================================
  2. Utilidades Comunes
  ... (mantener todas las utilidades como están)
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
  ... (mantener fetchChatsFromEvolution como está)
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

    // 💡 MODIFICACIÓN CLAVE: Construir el payload con la estructura 'where' y las opciones de paginación
    const payload: Record<string, any> = {
        where: {
            key: {
                remoteJid: remoteJid, // Se utiliza el parámetro 'remoteJid' de la función
            },
        },
    };

    // Agregar opciones de paginación/límite al payload, según sea necesario por la API (asumiendo que `limit` es para `offset`)
    if (options?.page) {
      // Nota: Si la API de Evolution usa 'page' para el paginado, se agrega.
      // Si usa 'offset', deberías calcularlo o usar un nombre de propiedad diferente.
      payload.page = options.page;
    }
    // Asumiendo que `pageSize` o `limit` se usaría para el número de registros por página/petición.
    if (options?.pageSize) {
        // Asumiendo que `pageSize` es el equivalente a `offset` en la documentación
        payload.offset = options.pageSize; 
    } else if (options?.limit) {
        payload.offset = options.limit; 
    }


    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options?.timeoutMs ?? 15000);

    try {
        // La función doRequest ya se encarga de serializar `payload` a JSON para el body de la petición POST.
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