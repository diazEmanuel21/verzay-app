'use server';

import type { ApiKey } from '@prisma/client'; // solo tipos

// ---------- Tipos Evolution API ----------
export type LastMessage = {
  id: string | null;
  key: {
    id: string;
    fromMe: boolean;
    remoteJid: string;
  };
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

export type ChatData = {
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
  isSaved: boolean;
};

type ChatArray = ChatData[];

type FetchChatsResult =
  | { success: true; message: string; data: ChatArray }
  | { success: false; message: string };

// ---------- Utilidades ----------
function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, ''); // quita barras al final
}

function isChatData(x: any): x is ChatData {
  return (
    x &&
    typeof x === 'object' &&
    typeof x.remoteJid === 'string' &&
    typeof x.windowActive === 'boolean'
  );
}

function ensureArrayResponse(payload: unknown): ChatArray {
  // Acepta: [ChatData]  ó  { data:[ChatData] }  ó  { chats:[ChatData] }
  const candidate =
    (Array.isArray(payload) && payload) ||
    (typeof payload === 'object' &&
      payload !== null &&
      (Array.isArray((payload as any).data) ? (payload as any).data : Array.isArray((payload as any).chats) ? (payload as any).chats : null));

  if (!candidate || !Array.isArray(candidate)) return [];

  // filtro defensivo por si vienen objetos “sucios”
  return candidate.filter(isChatData);
}

// ---------- Server Action ----------
/**
 * Obtiene la lista de chats desde Evolution API:
 * POST {baseURL}/chat/findChats/{instanceName}
 */
export async function fetchChatsFromEvolution(
  apiKeyData: Pick<ApiKey, 'url' | 'key'>,
  instanceName: string,
  options?: { timeoutMs?: number }
): Promise<FetchChatsResult> {
  const { url: baseUrlRaw, key: apiKey } = apiKeyData;

  if (!baseUrlRaw || !apiKey || !instanceName) {
    return {
      success: false,
      message:
        'Error de credenciales: La URL, la API Key o el nombre de la instancia no pueden ser nulos.',
    };
  }

  const baseURL = normalizeBaseUrl(baseUrlRaw);
  const endpointUrl = `${baseURL}/chat/findChats/${encodeURIComponent(instanceName)}`;

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    Math.max(1000, options?.timeoutMs ?? 15000)
  );

  try {
    const response = await fetch(endpointUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: apiKey,
      },
      body: JSON.stringify({}), // Evolution suele aceptar POST vacío
      cache: 'no-store',
      signal: controller.signal,
      next: { revalidate: 0 },
    });

    clearTimeout(timeout);

    const contentType = response.headers.get('content-type') || '';

    if (!response.ok) {
      let apiMsg = 'Error desconocido.';
      if (contentType.includes('application/json')) {
        const errJson = await response.json().catch(() => null);
        apiMsg = (errJson?.message as string) || apiMsg;
      } else {
        const errText = await response.text().catch(() => '');
        apiMsg = errText || apiMsg;
      }
      return {
        success: false,
        message: `Error en Evolution API (${response.status}): ${apiMsg}`,
      };
    }

    // Parse seguro según content-type
    const raw = contentType.includes('application/json')
      ? await response.json().catch(() => null)
      : await response.text().catch(() => null);

    if (raw == null) {
      return {
        success: false,
        message: 'La API respondió sin cuerpo o en un formato no válido.',
      };
    }

    const data = ensureArrayResponse(raw);

    return {
      success: true,
      message: `Chats obtenidos con éxito para la instancia ${instanceName}.`,
      data,
    };
  } catch (err: any) {
    clearTimeout(timeout);

    if (err?.name === 'AbortError') {
      return {
        success: false,
        message: 'La solicitud fue cancelada por timeout.',
      };
    }

    console.error('❌ Error de red o interno:', err);
    return {
      success: false,
      message: 'Error de red o interno al contactar la API.',
    };
  }
}
