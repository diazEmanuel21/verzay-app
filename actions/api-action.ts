"use server"

import { db } from "@/lib/db";
import { ApiKey } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { sendingMessages } from "./sending-messages-actions";
import { ClientResponse, DISCONNECT_COOLDOWN_MS, EVO_FETCH_TIMEOUT_MS, GenerateQrInterface, getEvoCache, isApiConnected, isWhatsappLike, QRCodeResponse } from "@/types/evo-api";

/* =========================
   Server-Action: Generar QR
   - Solo usa Evolution si instanceType es WhatsApp o nulo.
   - Mantiene TUS mensajes originales.
========================= */
export async function generateQRCode({ instanceName, userId }: GenerateQrInterface): Promise<QRCodeResponse> {
  // Buscar el usuario y su ApiKey asignada (lo necesitas para el key del cache y para notificar)
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { apiKey: true },
  });

  if (!user) {
    return { success: false, message: "El userId no existe." };
  }
  if (!user.apiKey) {
    return { success: false, message: "El usuario no tiene una ApiKey asignada." };
  }

  // Detectar tipo de instancia (si existe en BD)
  const inst = await db.instancias.findFirst({
    where: { userId, instanceName },
    select: { instanceType: true },
  });
  const instanceType = inst?.instanceType ?? null;

  if (!isWhatsappLike(instanceType)) {
    return { success: false, message: 'No se pudo generar el código QR.' };
  }

  const { key: apiKey, url: serverUrl } = user.apiKey;

  // cache por user+instance (puedes cambiar a user+serverUrl si prefieres)
  const cache = getEvoCache();
  const cacheKey = `${userId}::${instanceName}`;
  const now = Date.now();
  const entry = cache.get(cacheKey) ?? { lastIsConnected: null, lastNotifiedAt: 0 };

  let qr: { code: string; pairingCode?: string } | undefined;
  let connectionState: { instance: { state: string } } | undefined;

  // 🔽 esto es el estado de CONEXIÓN a la API (Evolution alive / dead)
  let apiConnectedNow = false;

  // para devolver mensaje si algo falla
  let failMessage: string | null = null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), EVO_FETCH_TIMEOUT_MS);

    const response = await fetch(`https://${serverUrl}/instance/connect/${instanceName}`, {
      method: 'GET',
      headers: { apikey: apiKey },
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    apiConnectedNow = isApiConnected(response.ok);

    if (!response.ok) {
      failMessage = `Error al conectar con la instancia. HTTP ${response.status}`;
    } else {
      const data = await response.json();

      if (data.base64) {
        qr = { code: data.base64, pairingCode: data.pairingCode };
      } else if (data.instance?.state === 'open') {
        connectionState = { instance: { state: 'open' } };
      } else {
        // API respondió OK pero no hay QR ni open (caso normal de “no listo”)
        // lo manejamos abajo con mensaje genérico
      }
    }
  } catch (error: any) {
    apiConnectedNow = false;
    failMessage =
      error?.name === 'AbortError'
        ? 'Timeout al conectar con Evolution.'
        : (error?.message || 'Error al generar el código QR.');
  }

  // regla anti-spam
  const transitionedToDisconnected = entry.lastIsConnected === true && apiConnectedNow === false;
  const cooldownOk = now - entry.lastNotifiedAt >= DISCONNECT_COOLDOWN_MS;

  let justNotified = false;

  if ((transitionedToDisconnected && cooldownOk) || (entry.lastIsConnected === null && !apiConnectedNow && cooldownOk)) {
    // Intento de notificación (si está configurado)
    const remoteJid = (user as any).notificationNumber as string | undefined;

    if (remoteJid) {
      try {
        const serverUrlAdmin = "evoapi.ia-app.com";
        const instanceNameAdmin = "Verzay Pro Atc";
        const sendTextUrl = `https://${serverUrlAdmin}/message/sendText/${instanceNameAdmin}`;

        await sendingMessages({
          url: sendTextUrl,
          apikey: apiKey,
          remoteJid,
          text: "Tu API de Evolution se encuentra desconectada. Por favor revisa tu configuración (token, instancia, credenciales) para restablecer la conexión.",
        });
      } catch {
        // best-effort: aunque falle el envío, evitamos spam
      }
    }

    entry.lastNotifiedAt = now;
    justNotified = true;
  }

  entry.lastIsConnected = apiConnectedNow;
  cache.set(cacheKey, entry);

  // ✅ respuestas finales, conservando tu lógica original
  if (!apiConnectedNow) {
    return {
      success: false,
      message: failMessage || 'Error al conectar con Evolution.',
      evo: {
        isConnected: false,
        status: "disconnected",
        justNotified,
        cooldownMs: DISCONNECT_COOLDOWN_MS,
      },
    };
  }

  if (qr) {
    return {
      success: true,
      qr,
      evo: {
        isConnected: true,
        status: "connected",
        justNotified: false,
        cooldownMs: DISCONNECT_COOLDOWN_MS,
      },
    };
  }

  if (connectionState?.instance?.state === 'open') {
    return {
      success: true,
      connectionState,
      evo: {
        isConnected: true,
        status: "connected",
        justNotified: false,
        cooldownMs: DISCONNECT_COOLDOWN_MS,
      },
    };
  }

  return {
    success: false,
    message: 'No se pudo generar el código QR.',
    evo: {
      isConnected: true, // API está viva, pero no se pudo generar QR/open
      status: "connected",
      justNotified: false,
      cooldownMs: DISCONNECT_COOLDOWN_MS,
    },
  };
}

/* =========================
   API Keys CRUD (sin cambios de mensajes)
========================= */
export async function agregarApi(data: FormData): Promise<ClientResponse<ApiKey>> {
  const url = data.get('url') as string
  const key = data.get('key') as string

  if (!url || !key) {
    return { success: false, message: 'Todos los campos son obligatorios' }
  }

  try {
    const createdApiKey = await db.apiKey.create({ data: { url, key } })
    return { success: true, message: 'API Key agregada exitosamente', data: createdApiKey }
  } catch (error: any) {
    console.error(error)
    return { success: false, message: error.message || 'Error al agregar la API Key' }
  }
}

export async function editarApiKey(data: FormData): Promise<ClientResponse<ApiKey>> {
  const id = data.get('id') as string
  const url = data.get('url') as string
  const key = data.get('key') as string

  if (!url || !key || !id) {
    return { success: false, message: 'Todos los campos son obligatorios' }
  }

  try {
    await db.apiKey.update({ where: { id }, data: { url, key } });
    return { success: true, message: "API Key actualizada exitosamente." }
  } catch (error: any) {
    return { success: false, message: error.message || "Error al actualizar la API Key." }
  }
}

export async function eliminarApiKey(id: string) {
  if (!id) {
    return { success: false, message: 'No se encontró el id' }
  }

  try {
    await db.apiKey.delete({ where: { id } });
    revalidatePath('/agregar-api');
    return { success: true, message: "API Key eliminada exitosamente." }
  } catch (error: any) {
    return { success: false, message: error.message || "Error al eliminar la API Key." }
  }
}

export async function obtenerApiKeys() {
  try {
    const apiKeys = await db.apiKey.findMany();
    return { success: true, data: apiKeys };
  } catch (error: any) {
    return { success: false, message: error.message || "Error al obtener las API Keys." };
  }
}

export async function getApiKeyById(id: string) {
  try {
    if (!id) return { success: false, message: 'Missing id' };
    const apiKey = await db.apiKey.findUnique({ where: { id } });
    return { success: true, data: apiKey };
  } catch (error: any) {
    return { success: false, message: error.message || "Error al obtener las API Keys." };
  }
}

/* =========================
   Instancias
========================= */
export async function createInstance(data: FormData) {
  const instanceName = data.get('instanceName') as string;
  const instanceType = data.get('instanceType') as string;
  const userId = data.get('userId') as string;

  try {
    // Validación de campos obligatorios
    if (!instanceName || !userId || !instanceType) {
      throw new Error('Todos los campos son obligatorios');
    }

    // Verificar si el usuario ya tiene una instancia activa
    const instanciaActiva = await checkActiveInstance(userId, instanceType);
    if (instanciaActiva) {
      return { success: false, message: "El usuario ya tiene una instancia activa.", instancia: instanciaActiva };
    }

    if (isWhatsappLike(instanceType)) {
      // 🔥 Evolution SOLO para WhatsApp/nulo
      const user = await db.user.findUnique({
        where: { id: userId },
        include: { apiKey: true },
      });

      if (!user || !user.apiKey) {
        throw new Error("El usuario no tiene una ApiKey asignada.");
      }

      const { key: apiKey, url: serverUrl } = user.apiKey;

      const options = {
        method: 'POST',
        headers: {
          'apikey': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          instanceName: instanceName,
          qrcode: true,
          integration: "WHATSAPP-BAILEYS"
        })
      };

      const response = await fetch(`https://${serverUrl}/instance/create`, options);
      const apiResult = await response.json();

      if (!response.ok) {
        throw new Error(apiResult.message || 'Error al crear la instancia en la API.');
      }

      const instanceId = apiResult.hash;
      if (!instanceId) {
        throw new Error('No se recibió instanceId en la respuesta de la API.');
      }

      const nuevaInstancia = await db.instancias.create({
        data: { instanceName, instanceType, userId, instanceId },
      });

      revalidatePath('/agregar-api');
      return { success: true, message: "Instancia creada exitosamente.", instancia: nuevaInstancia, apiResult };
    } else {
      // ❇️ Solo BD (mensajes iguales)
      const nuevaInstancia = await db.instancias.create({
        data: {
          instanceName,
          instanceType,
          userId,
          instanceId: `local-${randomUUID()}`, // id local para integridad
        },
      });

      revalidatePath('/agregar-api');
      return { success: true, message: "Instancia creada exitosamente.", instancia: nuevaInstancia };
    }
  } catch (error: any) {
    return { success: false, message: error.message || "Error al crear la instancia." };
  }
}

export async function deleteInstance(userId: string, instanceType: string = 'Whatsapp') {
  try {
    // Verificar si el usuario tiene una instancia activa
    const instanciaActiva = await checkActiveInstance(userId, instanceType);
    if (!instanciaActiva) {
      return { success: false, message: "El usuario no tiene ninguna instancia activa." };
    }

    const instanceName = instanciaActiva.instanceName;

    if (isWhatsappLike(instanceType)) {
      // 🔥 Evolution SOLO para WhatsApp/nulo
      const user = await db.user.findUnique({
        where: { id: userId },
        include: { apiKey: true },
      });

      if (!user || !user.apiKey) {
        throw new Error("El usuario no tiene una ApiKey asignada.");
      }

      const { key: apiKey, url: serverUrl } = user.apiKey;

      // 1. Logout de la instancia
      const logoutOptions = {
        method: 'DELETE',
        headers: {
          'apikey': apiKey,
          'Content-Type': 'application/json'
        }
      };

      const logoutResponse = await fetch(`https://${serverUrl}/instance/logout/${instanceName}`, logoutOptions);
      const logoutResult = await logoutResponse.json();

      if (!logoutResponse.ok) {
        throw new Error(logoutResult.message || 'Error al hacer logout de la instancia en la API.');
      }

      // 2. Eliminar la instancia en la API
      const deleteOptions = {
        method: 'DELETE',
        headers: {
          'apikey': apiKey,
          'Content-Type': 'application/json'
        }
      };

      const deleteResponse = await fetch(`https://${serverUrl}/instance/delete/${instanceName}`, deleteOptions);
      const deleteResult = await deleteResponse.json();

      if (!deleteResponse.ok) {
        throw new Error(deleteResult.message || 'Error al eliminar la instancia en la API.');
      }
    }

    // 3. Eliminar la instancia de la base de datos
    const instancia = await db.instancias.findFirst({
      where: { instanceName, instanceType }
    });

    if (!instancia) {
      throw new Error("No se encontró la instancia en la base de datos.");
    }

    await db.instancias.delete({ where: { id: instancia.id } });

    return { success: true, message: "Instancia eliminada exitosamente." };
  } catch (error: any) {
    return { success: false, message: error.message || "Error al eliminar la instancia." };
  }
}

// Función para verificar si el usuario ya tiene una instancia
export async function checkActiveInstance(userId: string, instanceType: string = 'Whatsapp') {
  const instanciaActiva = await db.instancias.findFirst({
    where: { userId, instanceType: instanceType },
  });
  return instanciaActiva;
}

// Funcion para traer datos del cliente
export async function getInstances(userId: string) {
  try {
    const instance = await db.instancias.findMany({
      where: { userId: userId },
      select: { instanceName: true, instanceId: true, instanceType: true },
    });

    // 🔥 Buscar el usuario y su ApiKey asignada
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { apiKey: true },
    });

    if (!user || !user.apiKey) {
      throw new Error("El usuario no tiene una ApiKey asignada.");
    }

    const { url: serverUrl } = user.apiKey;

    const instances = instance.map((i) => ({ ...i, serverUrl }));
    return instances;
  } catch (error) {
    console.error(`Error fetching from:`, error);
  }
}

// actions/createBotAction.ts
export async function createBotAction(data: FormData) {
  const instanceName = data.get('instanceName') as string;
  const instanceId = data.get('instanceId') as string;
  const systemMessage = data.get('systemMessage') as string;

  if (!instanceName || !instanceId || !systemMessage) {
    throw new Error('Faltan datos necesarios.');
  }

  const requestBody = {
    enabled: true,
    openaiCredsId: 'cm2nql5yd6e7g12gecbdrflit',
    botType: 'chatCompletion',
    model: 'gpt-4',
    systemMessages: [systemMessage],
    assistantMessages: ['\n\nHello there, how may I assist you today?'],
    userMessages: ['Hello!'],
    maxTokens: 300,
    triggerType: 'keyword',
    triggerOperator: 'equals',
    triggerValue: 'test',
    expire: 20,
    keywordFinish: '#EXIT',
    delayMessage: 1000,
    unknownMessage: 'Message not recognized',
    listeningFromMe: false,
    stopBotFromMe: false,
    keepOpen: false,
    debounceTime: 10,
    ignoreJids: [],
  };

  try {
    const response = await fetch(`https://conexion.aizenbots.com/openai/create/${instanceName}`, {
      method: 'POST',
      headers: {
        'apikey': instanceId,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al crear el bot');
    }

    return await response.json();
  } catch (err) {
    console.error(`Error:`, err);
  }
}

//Datos para api status
export async function getDataApi(userId: string, apiKeyId: string) {
  try {
    const apiKey = await db.apiKey.findFirst({
      where: { id: apiKeyId },
      select: { id: true, url: true, key: true },
    });

    const instancia = await db.instancias.findFirst({
      where: { userId },
      select: { id: true, instanceName: true, instanceId: true },
    });

    if (!apiKey || !instancia) {
      return {
        success: false,
        data: null,
        message: "No se encontró ApiKey o Instancia para este usuario.",
      };
    }

    return {
      success: true,
      data: {
        apiKeyId: apiKey.id,
        url: apiKey.url,
        key: instancia.instanceId,
        instanceName: instancia.instanceName,
        instanceId: instancia.instanceId,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Error al obtener datos de la API.",
    };
  }
}