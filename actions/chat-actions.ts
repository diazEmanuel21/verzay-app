'use server';

import type { ApiKey } from '@prisma/client';

// -------- Tipos (los tuyos) --------
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

type ChatData = {
  id: string | null;
  remoteJid: string;
  pushName: string | null;
  profilePicUrl: string | null;
  updatedAt: string;
  windowStart: string;
  windowExpires: string;
  windowActive: boolean;
  lastMessage: LastMessage | null;
  unreadCount: number;
  isSaved: number | boolean;
};

type ChatArray = ChatData[];

type FetchChatsResult =
  | { success: true; message: string; data: ChatArray }
  | { success: false; message: string };

// -------- Utils --------
function normalizeBaseUrl(url: string): string {
  // 1) quita slashes finales
  const trimmed = (url || '').trim().replace(/\/+$/, '');
  // 2) si no trae protocolo, asume https
  if (!/^https?:\/\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

function isChatData(x: any): x is ChatData {
  return x && typeof x === 'object' && typeof x.remoteJid === 'string' && typeof x.windowActive !== 'undefined';
}

/** Soporta { data: [...] } | { chats: [...] } | { contacts: [...] } | [ ... ] */
function ensureArrayResponse(payload: unknown): ChatArray {
  const arr =
    (Array.isArray(payload) && payload) ||
    (typeof payload === 'object' &&
      payload !== null &&
      (
        Array.isArray((payload as any).data) ? (payload as any).data :
        Array.isArray((payload as any).chats) ? (payload as any).chats :
        Array.isArray((payload as any).contacts) ? (payload as any).contacts :
        null
      ));

  if (!arr || !Array.isArray(arr)) return [];
  return arr.filter(isChatData);
}

async function doRequest(
  url: string,
  apikeyHeader: string,
  signal: AbortSignal,
  method: 'POST' | 'GET'
) {
  return fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, */*',
      apikey: apikeyHeader,
    },
    body: method === 'POST' ? JSON.stringify({}) : undefined,
    cache: 'no-store',           // ✅ usa solo uno de estos
    // next: { revalidate: 0 },  // ❌ quítalo para evitar el warning
    signal,
  });
}

// -------- Llamada principal --------
export async function fetchChatsFromEvolution(
  apiKeyData: Pick<ApiKey, 'url' | 'key'>,
  instanceName: string,
  options?: {
    overrideApiKeyHeader?: string;
    timeoutMs?: number;
    allowInsecureTLS?: boolean; // SOLO en dev si tu cert es self-signed
    path?:  'findChats'; // por si tu backend usa uno u otro
  }
): Promise<FetchChatsResult> {
  const { url: baseUrlRaw, key: globalApiKey } = apiKeyData;

  if (!baseUrlRaw || !globalApiKey || !instanceName) {
    return { success: false, message: 'URL / API Key / instanceName faltantes.' };
  }

  if (options?.allowInsecureTLS) {
    
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }

  const baseURL = normalizeBaseUrl(baseUrlRaw);                          // ✅ ahora garantiza https://
  const safeInstance = encodeURIComponent(instanceName);                 // ✅ por si hay espacios
  const path = options?.path ?? 'findChats';                          // cambia a 'findChats' si aplica
  const endpointUrl = `${baseURL}/chat/${path}/${safeInstance}`;

  const apikeyHeader = options?.overrideApiKeyHeader ?? globalApiKey;

  console.log('➡️ [fetchChatsFromEvolution] URL:', endpointUrl);

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    Math.max(1000, options?.timeoutMs ?? 15000)
  );

  try {
    // 1) POST
    let response = await doRequest(endpointUrl, apikeyHeader, controller.signal, 'POST');

    // 2) Si tu instancia lo expone como GET, reintenta
    if (response.status === 404 || response.status === 405) {
      console.warn(`↪️ Reintentando con GET por status ${response.status}`);
      response = await doRequest(endpointUrl, apikeyHeader, controller.signal, 'GET');
    }

    clearTimeout(timeout);

    const ct = response.headers.get('content-type') || '';
    if (!response.ok) {
      let apiMsg = 'Error desconocido.';
      if (ct.includes('application/json')) {
        const errJson = await response.json().catch(() => null);
        apiMsg = (errJson?.message as string) || JSON.stringify(errJson) || apiMsg;
      } else {
        const errText = await response.text().catch(() => '');
        apiMsg = errText || apiMsg;
      }
      return { success: false, message: `Error en Evolution API (${response.status}): ${apiMsg}` };
    }

    const raw = ct.includes('application/json')
      ? await response.json().catch(() => null)
      : await response.text().catch(() => null);

    if (raw == null) {
      return { success: false, message: 'La API respondió sin cuerpo o inválido.' };
    }

    const data = ensureArrayResponse(raw);
    return { success: true, message: `OK ${path} ${instanceName}`, data };
  } catch (err: any) {
    clearTimeout(timeout);
    if (err?.name === 'AbortError') {
      return { success: false, message: 'Timeout de solicitud.' };
    }
    // Pistas comunes: protocolo faltante, DNS, cert TLS, puerto
    return { success: false, message: `Error de red/interno: ${err?.message || String(err)}` };
  }
}
