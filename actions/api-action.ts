"use server"

import { db } from "@/lib/db";
import { ApiKey } from "@prisma/client";
import { revalidatePath } from "next/cache";

interface GenerateQrInterface {
  instanceName: string
  userId: string
}
interface ClientResponse<T = undefined> {
  success: boolean
  message: string
  data?: T
}
interface WhatsAppConnectionStatus {
  qr?: {
    code: string; // Código QR en formato base64
    pairingCode: string; // Código de emparejamiento
  };
  connectionState?: {
    instance: {
      state: string; // Estado de la conexión (e.g. 'open', 'closed')
    };
  };
  success: boolean; // Indica si la conexión fue exitosa
}

interface QRCodeResponse {
  qr?: {
    code: string; // Código QR en formato base64
    pairingCode?: string; // Código de emparejamiento (opcional)
  };
  connectionState?: {
    instance: {
      state: string; // Estado de la conexión (e.g. 'open', 'closed')
    };
  };
  success: boolean; // Indica si la operación fue exitosa
  message?: string; // Mensaje opcional para el usuario
}

//Server-Action Para generar el QR
export async function generateQRCode({ instanceName, userId }: GenerateQrInterface): Promise<QRCodeResponse> {
  try {
    // 🔥 Buscar el usuario y su ApiKey asignada
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { apiKey: true },
    });


    if (!user) {
      throw new Error("El userId no existe.");
    }
    if (!user.apiKey) {
      throw new Error("El usuario no tiene una ApiKey asignada.");
    }

    const { key: apiKey, url: serverUrl } = user.apiKey;

    // Lógica para obtener el código QR desde tu API
    const response = await fetch(`https://${serverUrl}/instance/connect/${instanceName}`, {
      method: 'GET',
      headers: {
        apikey: apiKey,
      },
    });

    if (!response.ok) {
      throw new Error('Error al conectar con la instancia.');
    }

    const data = await response.json();

    // Retornar el resultado basado en la respuesta de la API
    if (data.base64) {
      return {
        success: true,
        qr: {
          code: data.base64,
          pairingCode: data.pairingCode, // Si se incluye en la respuesta
        },
      };
    } else if (data.instance.state === 'open') {
      return {
        success: true,
        connectionState: {
          instance: {
            state: 'open',
          },
        },
      };
    } else {
      return {
        success: false,
        message: 'No se pudo generar el código QR.',
      };
    }
  } catch (error: any) {
    return { success: false, message: error.message || 'Error al generar el código QR.' };
  }
}
export async function agregarApi(data: FormData): Promise<ClientResponse<ApiKey>> {
  const url = data.get('url') as string
  const key = data.get('key') as string

  if (!url || !key) {
    return {
      success: false,
      message: 'Todos los campos son obligatorios',
    }
  }

  try {
    const createdApiKey = await db.apiKey.create({
      data: { url, key }
    })

    return {
      success: true,
      message: 'API Key agregada exitosamente',
      data: createdApiKey,
    }

  } catch (error: any) {
    console.error(error)

    return {
      success: false,
      message: error.message || 'Error al agregar la API Key',
    }
  }
}
export async function editarApiKey(data: FormData): Promise<ClientResponse<ApiKey>> {
  const id = data.get('id') as string
  const url = data.get('url') as string
  const key = data.get('key') as string

  if (!url || !key || !id) {
    return {
      success: false,
      message: 'Todos los campos son obligatorios',
    }
  }

  try {
    // Actualizar la API Key en la base de datos
    await db.apiKey.update({
      where: { id },
      data: { url, key }
    });

    return {
      success: true,
      message: "API Key actualizada exitosamente."
    };

  } catch (error: any) {
    return {
      success: false,
      message: error.message
        || "Error al actualizar la API Key."
    };
  }
}
export async function eliminarApiKey(id: string) {
  if (!id) {
    return {
      success: false,
      message: 'No se encontró el id',
    }
  }

  try {
    // Eliminar la API Key de la base de datos
    await db.apiKey.delete({
      where: { id },
    });

    // Revalidar la página si es necesario
    revalidatePath('/agregar-api');

    return {
      success: true,
      message: "API Key eliminada exitosamente."
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Error al eliminar la API Key."
    };
  }
}
export async function obtenerApiKeys() {
  try {
    // Obtener todas las API Keys de la base de datos
    const apiKeys = await db.apiKey.findMany();

    return { success: true, data: apiKeys };
  } catch (error: any) {
    // Manejo de errores
    return { success: false, message: error.message || "Error al obtener las API Keys." };
  }
}
export async function getApiKeyById(id: string) {
  try {
    if (!id) return { success: false, message: 'Missing id' };

    // Obtener todas las API Keys de la base de datos
    const apiKey = await db.apiKey.findUnique({
      where: { id }
    });

    return { success: true, data: apiKey };
  } catch (error: any) {
    // Manejo de errores
    return { success: false, message: error.message || "Error al obtener las API Keys." };
  }
}
// Función para crear una instancia si el usuario no tiene una
export async function createInstance(data: FormData) {
  const instanceName = data.get('instanceName') as string;
  const userId = data.get('userId') as string;

  try {
    // Validación de campos obligatorios
    if (!instanceName || !userId) {
      throw new Error('Todos los campos son obligatorios');
    }

    // Verificar si el usuario ya tiene una instancia activa
    const instanciaActiva = await checkActiveInstance(userId);
    if (instanciaActiva) {
      return { success: false, message: "El usuario ya tiene una instancia activa.", instancia: instanciaActiva };
    }

    // 🔥 Buscar el usuario y su ApiKey asignada
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { apiKey: true },
    });

    if (!user || !user.apiKey) {
      throw new Error("El usuario no tiene una ApiKey asignada.");
    }

    const { key: apiKey, url: serverUrl } = user.apiKey;

    // Configurar las opciones para la llamada a la API externa
    const options = {
      method: 'POST',
      headers: {
        'apikey': apiKey,  // Usar la clave API obtenida de la base de datos
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        instanceName: instanceName,
        qrcode: true,
        integration: "WHATSAPP-BAILEYS"
      })
    };

    // Realizar la llamada a la API externa usando el serverUrl
    const response = await fetch(`https://${serverUrl}/instance/create`, options);
    const apiResult = await response.json();

    // Manejo de errores en la respuesta de la API
    if (!response.ok) {
      throw new Error(apiResult.message || 'Error al crear la instancia en la API.');
    }

    // Extraer el instanceId desde el objeto "instance" en la respuesta de la API
    const instanceId = apiResult.hash;
    if (!instanceId) {
      throw new Error('No se recibió instanceId en la respuesta de la API.');
    }

    // Guardar la nueva instancia en la base de datos si la creación en la API fue exitosa
    const nuevaInstancia = await db.instancias.create({
      data: {
        instanceName,
        userId,
        instanceId,  // Usar el instanceId extraído de la respuesta
      },
    });

    // Revalidar la página si es necesario
    revalidatePath('/agregar-api');

    return { success: true, message: "Instancia creada exitosamente.", instancia: nuevaInstancia, apiResult };
  } catch (error: any) {
    return { success: false, message: error.message || "Error al crear la instancia." };
  }
}
export async function deleteInstance(userId: string) {
  try {
    // Verificar si el usuario tiene una instancia activa
    const instanciaActiva = await checkActiveInstance(userId);
    if (!instanciaActiva) {
      return { success: false, message: "El usuario no tiene ninguna instancia activa." };
    }

    const instanceName = instanciaActiva.instanceName;

    // 🔥 Buscar el usuario y su ApiKey asignada
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

    // 3. Eliminar la instancia de la base de datos
    const instancia = await db.instancias.findFirst({
      where: { instanceName }
    });

    if (!instancia) {
      throw new Error("No se encontró la instancia en la base de datos.");
    }

    await db.instancias.delete({
      where: { id: instancia.id }
    });

    return { success: true, message: "Instancia eliminada exitosamente." };
  } catch (error: any) {
    return { success: false, message: error.message || "Error al eliminar la instancia." };
  }
}
// Función para verificar si el usuario ya tiene una instancia
export async function checkActiveInstance(userId: string) {
  const instanciaActiva = await db.instancias.findFirst({
    where: { userId },
  });

  return instanciaActiva;
}
// Funcion para traer datos del cliente
export async function getInstances(userId: string) {
  try {
    const instance = await db.instancias.findMany({
      where: {
        userId: userId,
      },
      select: {
        instanceName: true,
        instanceId: true,
      },
    });

    // 🔥 Buscar el usuario y su ApiKey asignada
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { apiKey: true },
    });

    if (!user || !user.apiKey) {
      throw new Error("El usuario no tiene una ApiKey asignada.");
    }

    const { key: apiKey, url: serverUrl } = user.apiKey;

    // Agregar apiKey y serverUrl a cada instancia
    const instances = instance.map((instance) => ({
      ...instance,
      serverUrl
    }));

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
      where: {
        id: apiKeyId
      },
      select: {
        id: true,
        url: true,
        key: true,
      },
    });

    const instancia = await db.instancias.findFirst({
      where: { userId },
      select: {
        id: true,
        instanceName: true,
        instanceId: true,
      },
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