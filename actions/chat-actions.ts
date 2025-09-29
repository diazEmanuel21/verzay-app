"use server";

import { ApiKey } from "@prisma/client";

// Define los tipos para la propiedad "lastMessage" anidada
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
        imageMessage?: object; // Simplificado, puedes detallar más
        documentMessage?: object; // Simplificado
        messageContextInfo?: object; // Simplificado
    };
    contextInfo: object | null;
    source: string;
    messageTimestamp: number;
    instanceId: string;
    sessionId: string | null;
    status: string;
};

// Define el tipo principal para cada objeto en el array
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

type ChatArray = ChatData[]

/**
 * Server Action para procesar un array de datos de chat.
 *
 * @param formData FormData recibido del formulario (contiene el array JSON como string).
 * @returns Un objeto con el resultado de la operación.
 */
export async function processChatData(formData: FormData) {
  // 1. Obtener el dato del FormData
  const rawData = formData.get("chatDataArray");

  if (!rawData || typeof rawData !== "string") {
    return {
      success: false,
      message: "Error: No se encontró el array de datos o el formato es incorrecto.",
    };
  }

  try {
    // 2. Parsear el string JSON a un objeto TypeScript
    const chatArray: ChatArray = JSON.parse(rawData);

    // 3. Realizar la lógica del servidor aquí
    console.log(`✅ Server Action ejecutada. Elementos recibidos: ${chatArray.length}`);

    // Ejemplo de lógica: Iterar y extraer datos clave
    const processedResults = chatArray.map((chat) => ({
      id: chat.id,
      remoteJid: chat.remoteJid,
      pushName: chat.pushName || "Sin Nombre",
      lastMessageText: chat.lastMessage?.message.conversation || chat.lastMessage?.messageType || "No hay mensaje de texto",
      updatedAt: new Date(chat.updatedAt).toLocaleDateString(),
    }));

    // console.log("Resultados procesados:", processedResults);

    // 4. Devolver un objeto de respuesta (opcionalmente revalidar paths)
    // revalidatePath('/chats'); // Descomentar si es necesario actualizar la caché
    
    return {
      success: true,
      message: `Datos de ${chatArray.length} chats procesados con éxito.`,
      data: processedResults,
    };
  } catch (error) {
    console.error("❌ Error al procesar los datos del chat:", error);
    return {
      success: false,
      message: "Error interno del servidor al procesar el JSON.",
    };
  }
}