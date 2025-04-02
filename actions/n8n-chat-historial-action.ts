'use server';

import { db } from "@/lib/db";
import { n8n_chat_histories } from "@prisma/client";

interface N8nOperationResponse {
  success: boolean;
  message: string;
  data?: n8n_chat_histories | null;
}

export async function deleteConversationN8N(
  userId: string,
  sessionId: number,
  remoteJid: string
): Promise<N8nOperationResponse> {
  try {
    // 1. Validación de parámetros
    if (!userId || !remoteJid) {
      return {
        success: false,
        message: 'Datos de entrada incompletos'
      };
    }

    // 2. Obtener instancia del usuario
    const instance = await db.instancias.findFirst({
      where: { userId },
      select: { instanceName: true }
    });

    if (!instance?.instanceName) {
      return {
        success: false,
        message: 'No se encontró instancia asociada al usuario'
      };
    }

    // 3. Eliminar TODAS las conversaciones con ese session_id
    const sessionIdentifier = `${instance.instanceName}-${remoteJid}`;
    console.log(`ID de sesión a eliminar: ${sessionIdentifier}`);
    
    const deleteResult = await db.n8n_chat_histories.deleteMany({
      where: { session_id: sessionIdentifier }
    });

    if (deleteResult.count === 0) {
      return {
        success: false,
        message: 'No se encontró historial de conversación para este cliente'
      };
    }

    return {
      success: true,
      message: `Se eliminaron ${deleteResult.count} registros de historial de conversación exitosamente`,
      data: null
    };

  } catch (error) {
    console.error('Error en deleteConversationN8N:', error);
    return {
      success: false,
      message: 'Error interno al eliminar la conversación',
      data: null
    };
  }
}