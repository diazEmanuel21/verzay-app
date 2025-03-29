'use server';

import { db } from "@/lib/db";
import { n8n_chat_historial } from "@prisma/client";

interface N8nOperationResponse {
  success: boolean;
  message: string;
  data?: n8n_chat_historial | null;
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

    // 3. Buscar conversación
    const sessionIdentifier = `${instance.instanceName}-${remoteJid}`;
    const conversation = await db.n8n_chat_historial.findFirst({
      where: { session_id: sessionIdentifier },
      select: { id: true }
    });

    if (!conversation) {
      return {
        success: false,
        message: 'No se encontró historial de conversación para este cliente'
      };
    }

    // 4. Eliminar conversación
    await db.n8n_chat_historial.delete({
      where: { id: conversation.id }
    });

    return {
      success: true,
      message: 'Historial de conversación eliminado exitosamente',
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