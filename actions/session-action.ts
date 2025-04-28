'use server'

import { db } from '@/lib/db'
import { Session } from '@prisma/client';

interface SessionResponse<T = Session[]> {
    success: boolean;
    message: string;
    data?: T;
};

export async function getSessionsCountByUserId(userId: string) {
    try {
      const total = await db.session.count({
        where: { userId },
      });
  
      const active = await db.session.count({
        where: { userId, status: true },
      });
  
      const inactive = total - active;
  
      return {
        success: true,
        data: {
          total,
          active,
          inactive,
        }
      };
    } catch (error) {
      console.error('Error al obtener los conteos de sesiones:', error);
      return {
        success: false,
        message: 'Error al obtener los conteos',
      };
    }
}

export async function getSessionsByUserId(
    userId: string,
    skip: number = 0,
    take: number = 20
): Promise<SessionResponse> {
    try {
      if (!userId) return {
        success: false,
        message: 'No existe el userId',
        data: []
      };
  
      const sessions = await db.session.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip,
        take
      });
  
      return {
        success: true,
        message: 'Sesiones obtenidas correctamente',
        data: sessions
      };
  
    } catch (error) {
      console.error('Error al obtener las sesiones:', error);
  
      let errorMessage = 'No se pudieron cargar las sesiones';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
  
      return {
        success: false,
        message: errorMessage
      };
    }
}

export async function updateSessionStatus(sessionId: number, status: boolean): Promise<SessionResponse> {
    try {
        await db.session.update({
            where: { id: sessionId },
            data: { status }
        });

        return {
            success: true,
            message: 'Estado de la sesión actualizado correctamente',
        };

    } catch (error) {
        console.error('Error al actualizar la sesión:', error);

        let errorMessage = 'No se pudo actualizar el estado de la sesión';
        if (error instanceof Error) {
            errorMessage = error.message;
        }

        return {
            success: false,
            message: errorMessage
        };
    }
};

export async function deleteSession(
    userId: string,
    sessionId: number,
    remoteJid: string
): Promise<SessionResponse> {
    try {
        const session = await db.session.findFirst({
            where: {
                AND: [
                    { id: sessionId },
                    { userId: userId },
                    { remoteJid: remoteJid }
                ]
            }
        });

        if (!session) {
            return {
                success: false,
                message: 'Sesión no encontrada o no coincide con los criterios.'
            };
        }

        await db.session.delete({
            where: { id: sessionId }
        });

        return {
            success: true,
            message: 'Sesión eliminada correctamente.'
        };
    } catch (error) {
        console.error('Error al eliminar sesión:', error);
        return {
            success: false,
            message: 'Error al eliminar la sesión. Verifica los datos e intenta nuevamente.'
        };
    }
}

/**
 * 🔎 Nueva función para buscar sesiones por nombre o número en toda la base de datos.
 */
export async function searchSessionsByUserId(userId: string, query: string): Promise<SessionResponse> {
    try {
      if (!userId) return {
        success: false,
        message: 'No existe el userId',
        data: []
      };
  
      const sessions = await db.session.findMany({
        where: {
          userId,
          OR: [
            { pushName: { contains: query, mode: 'insensitive' } },
            { remoteJid: { contains: query, mode: 'insensitive' } }
          ]
        },
        orderBy: { createdAt: "desc" },
        take: 100  // puedes ajustar si quieres limitar resultados
      });
  
      return {
        success: true,
        message: 'Resultados de búsqueda obtenidos correctamente',
        data: sessions
      };
    } catch (error) {
      console.error('Error al buscar sesiones:', error);
      return {
        success: false,
        message: 'Error al buscar las sesiones'
      };
    }
}
