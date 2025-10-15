'use server';

import { db } from "@/lib/db";
import { ApiKey } from "@prisma/client";
import { revalidatePath } from "next/cache";

/* ==================================
0. Tipos de Interfaz
================================== */

interface GenerateQrInterface {
  instanceName: string
  userId: string
}
interface ClientResponse<T = undefined> {
  success: boolean
  message: string
  data?: T
}
interface QRCodeResponse {
  qr?: {
    code: string;
    pairingCode?: string;
  };
  connectionState?: {
    instance: {
      state: string;
    };
  };
  success: boolean;
  message?: string;
}

/* ==================================
1. Utilidades Auxiliares
================================== */

function normalizeBaseUrl(url: string): string {
  const trimmed = (url || '').trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '');
  return trimmed;
}

/**
 * Función para verificar si el usuario ya tiene UNA instancia activa (usa findFirst).
 */
export async function checkActiveInstance(userId: string, instanceType: string = 'Whatsapp') {
  const instanciaActiva = await db.instancias.findFirst({
    where: { userId, instanceType: instanceType },
  });

  return instanciaActiva;
}

/* ==================================
2. Server Actions: Instancias y QR
================================== */

export async function generateQRCode({ instanceName, userId }: GenerateQrInterface): Promise<QRCodeResponse> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { apiKey: true },
    });

    if (!user) throw new Error("El userId no existe.");
    if (!user.apiKey) throw new Error("El usuario no tiene una ApiKey asignada.");

    const { key: apiKey, url: serverUrlRaw } = user.apiKey;
    const serverUrl = normalizeBaseUrl(serverUrlRaw);

    const response = await fetch(`https://${serverUrl}/instance/connect/${instanceName}`, {
      method: 'GET',
      headers: { apikey: apiKey },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
      throw new Error(errorData.message || 'Error al conectar con la instancia.');
    }

    const data = await response.json();

    if (data.base64) {
      return {
        success: true,
        qr: { code: data.base64, pairingCode: data.pairingCode },
      };
    } else if (data.instance?.state === 'open') {
      return {
        success: true,
        connectionState: { instance: { state: 'open' } },
        message: 'Instancia ya conectada.',
      };
    } else {
      return {
        success: false,
        message: data.message || 'No se pudo generar el código QR.',
      };
    }
  } catch (error: any) {
    console.error("Error en generateQRCode:", error.message);
    return { success: false, message: error.message || 'Error al generar el código QR.' };
  }
}

export async function createInstance(data: FormData) {
  const instanceName = data.get('instanceName') as string;
  const instanceType = data.get('instanceType') as string;
  const userId = data.get('userId') as string;

  try {
    if (!instanceName || !userId || !instanceType) throw new Error('Todos los campos son obligatorios');

    const instanciaActiva = await checkActiveInstance(userId, instanceType);
    if (instanciaActiva) {
      return { success: false, message: "El usuario ya tiene una instancia activa.", instancia: instanciaActiva };
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      include: { apiKey: true },
    });

    if (!user || !user.apiKey) throw new Error("El usuario no tiene una ApiKey asignada.");

    const { key: apiKey, url: serverUrlRaw } = user.apiKey;
    const serverUrl = normalizeBaseUrl(serverUrlRaw);

    const options = {
      method: 'POST',
      headers: { 'apikey': apiKey, 'Content-Type': 'application/json' },
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
  } catch (error: any) {
    console.error("Error en createInstance:", error.message);
    return { success: false, message: error.message || "Error al crear la instancia." };
  }
}

/**
 * 🔥 IMPLEMENTACIÓN CORREGIDA CON LOGS Y LÓGICA DE BÚSQUEDA OR
 * Solo realiza llamadas a Evolution API si la instancia es de tipo 'Whatsapp' o nula.
 */
export async function deleteInstance(userId: string, instanceType?: string | null) {
  console.log(`[DELETE START] Iniciando borrado para userId: ${userId}, instanceType recibido: ${instanceType}`);

  try {
    // 1. Aplicar valor por defecto: usa 'Whatsapp' si el valor es null o undefined.
    const finalTipoInstancia = instanceType ?? 'Whatsapp';
    console.log(`[DELETE INFO] Tipo de instancia a buscar (final): ${finalTipoInstancia}`);

    // 2. Construir la cláusula WHERE usando OR si el tipo es 'Whatsapp'.
    let whereClause: any = { userId };

    if (finalTipoInstancia === 'Whatsapp') {
      // Buscamos 'Whatsapp' O 'null'.
      whereClause = {
        userId,
        OR: [
          { instanceType: 'Whatsapp' },
          { instanceType: null }
        ]
      };
      console.log("[DELETE INFO] Aplicando filtro OR (Whatsapp y NULL) para la búsqueda.");
    } else if (finalTipoInstancia) {
      // Buscamos solo el tipo especificado.
      whereClause.instanceType = finalTipoInstancia;
      console.log(`[DELETE INFO] Aplicando filtro simple para: ${finalTipoInstancia}.`);
    }

    const instancias = await db.instancias.findMany({
      where: whereClause,
      select: { id: true, instanceName: true, instanceType: true }
    });

    if (instancias.length === 0) {
      console.log(`[DELETE SKIP] No se encontraron instancias del tipo(s) buscado(s) para el usuario.`);
      return { success: false, message: `El usuario no tiene instancias del tipo solicitado para eliminar.` };
    }

    console.log(`[DELETE COUNT] Se encontraron ${instancias.length} instancias para intentar borrar.`);

    // 3. Obtener ApiKey y Server URL
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { apiKey: true },
    });

    // ----------------------------------------------------
    // 🔥 CORRECCIÓN DEL ERROR DE NULIDAD (TS18047) 🔥
    // Verificamos si user y user.apiKey existen antes de acceder a las propiedades.
    const userApiKey = user?.apiKey;

    const hasApiKey = !!userApiKey;
    const serverUrl = hasApiKey ? normalizeBaseUrl(userApiKey!.url) : null;
    const apiKey = hasApiKey ? userApiKey!.key : null;
    // ----------------------------------------------------

    if (!hasApiKey && instancias.some(i => !i.instanceType || i.instanceType === 'Whatsapp')) {
      console.warn(`[DELETE WARN] API Key no encontrada. ${instancias.length} registros se eliminarán solo LOCALMENTE.`);
    }

    let apiDeleteSuccessCount = 0;

    // --- 4. Bucle para eliminar CADA instancia ---
    for (const instancia of instancias) {
      const instanceName = instancia.instanceName;

      // Lógica de bifurcación: solo llamar a la API si es Whatsapp/Null Y tenemos API Key.
      const shouldCallEvolutionAPI = hasApiKey && (!instancia.instanceType || instancia.instanceType === 'Whatsapp');

      if (shouldCallEvolutionAPI) {
        console.log(`[DELETE API] Intentando borrar instancia Evolution: ${instanceName} (Tipo: ${instancia.instanceType})`);

        // Usamos el operador ! para asegurar a TypeScript que apiKey/serverUrl no son null aquí.
        const deleteOptions = {
          method: 'DELETE',
          headers: { 'apikey': apiKey!, 'Content-Type': 'application/json' }
        };

        const deleteResponse = await fetch(`https://${serverUrl!}/instance/delete/${instanceName}`, deleteOptions);
        const deleteResult = await deleteResponse.json().catch(() => ({ message: 'No JSON response or instance already deleted.' }));

        if (!deleteResponse.ok) {
          console.warn(
            `[DELETE FAIL] Fallo al borrar API para ${instanceName}. Estado: ${deleteResponse.status}. 
                        Mensaje: ${deleteResult.message || JSON.stringify(deleteResult)}`
          );
        } else {
          console.log(`[DELETE SUCCESS] API borrada para ${instanceName}.`);
          apiDeleteSuccessCount++;
        }
      } else {
        console.log(`[DELETE SKIP] Saltando llamada API para ${instanceName}. Tipo: ${instancia.instanceType} (Solo DB)`);
      }
    }

    // --- 5. Eliminación masiva de la base de datos local (Prisma) ---
    const deletedCount = await db.instancias.deleteMany({
      where: whereClause
    });

    console.log(`[DELETE DB] Eliminados ${deletedCount.count} registros de la DB local.`);
    console.log(`[DELETE END] Proceso completado. Éxito en API: ${apiDeleteSuccessCount}/${instancias.length}`);

    revalidatePath('/');

    return { success: true, message: `Se eliminaron ${deletedCount.count} instancias de la base de datos local. (${apiDeleteSuccessCount} borradas en Evolution API)` };

  } catch (error: any) {
    console.error(`[DELETE ERROR] Error crítico en el proceso de borrado: ${error.message}`);
    return { success: false, message: error.message || "Error al eliminar las instancias." };
  }
}

export async function getInstances(userId: string) {
  try {
    const instance = await db.instancias.findMany({
      where: { userId: userId },
      select: { instanceName: true, instanceId: true },
    });

    const user = await db.user.findUnique({
      where: { id: userId },
      include: { apiKey: true },
    });

    if (!user || !user.apiKey) throw new Error("El usuario no tiene una ApiKey asignada.");

    const { url: serverUrlRaw } = user.apiKey;
    const serverUrl = normalizeBaseUrl(serverUrlRaw);

    const instances = instance.map((instance) => ({
      ...instance,
      serverUrl
    }));

    return instances;

  } catch (error) {
    console.error(`Error fetching instances:`, error);
  }
}

/* ==================================
3. Server Actions: API Keys
================================== */

export async function agregarApi(data: FormData): Promise<ClientResponse<ApiKey>> {
  const url = data.get('url') as string
  const key = data.get('key') as string

  if (!url || !key) {
    return { success: false, message: 'Todos los campos son obligatorios' }
  }

  try {
    const createdApiKey = await db.apiKey.create({
      data: { url, key }
    })

    return { success: true, message: 'API Key agregada exitosamente', data: createdApiKey }

  } catch (error: any) {
    console.error("Error en agregarApi:", error)
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
    await db.apiKey.update({
      where: { id },
      data: { url, key }
    });

    return { success: true, message: "API Key actualizada exitosamente." };

  } catch (error: any) {
    console.error("Error en editarApiKey:", error)
    return { success: false, message: error.message || "Error al actualizar la API Key." };
  }
}

export async function eliminarApiKey(id: string) {
  if (!id) {
    return { success: false, message: 'No se encontró el id' }
  }

  try {
    await db.apiKey.delete({
      where: { id },
    });

    revalidatePath('/agregar-api');

    return { success: true, message: "API Key eliminada exitosamente." };
  } catch (error: any) {
    console.error("Error en eliminarApiKey:", error)
    return { success: false, message: error.message || "Error al eliminar la API Key." };
  }
}

export async function obtenerApiKeys() {
  try {
    const apiKeys = await db.apiKey.findMany();
    return { success: true, data: apiKeys };
  } catch (error: any) {
    console.error("Error en obtenerApiKeys:", error)
    return { success: false, message: error.message || "Error al obtener las API Keys." };
  }
}

export async function getApiKeyById(id: string) {
  try {
    if (!id) return { success: false, message: 'Missing id' };

    const apiKey = await db.apiKey.findUnique({
      where: { id }
    });

    return { success: true, data: apiKey };
  } catch (error: any) {
    console.error("Error en getApiKeyById:", error)
    return { success: false, message: error.message || "Error al obtener las API Keys." };
  }
}

/* ==================================
4. Server Actions: Bot y Status
================================== */

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
      headers: { 'apikey': instanceId, 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al crear el bot');
    }

    return await response.json();
  } catch (err) {
    console.error(`Error en createBotAction:`, err);
  }
}

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
    console.error("Error en getDataApi:", error);
    return {
      success: false,
      message: error.message || "Error al obtener datos de la API.",
    };
  }
}