'use server'

import { db } from '@/lib/db'
import { registerSessionSchema } from '@/schema/session';
import { Session } from '@prisma/client';
import { z } from 'zod';

interface SessionResponse<T = Session[]> {
  success: boolean;
  message: string;
  data?: T;
};

interface SessionResponseSingle {
  success: boolean;
  message: string;
  data?: Session; // Solo un objeto Session, no un array
}

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
  take: number = 20,
  status?: boolean // true: activos, false: inactivos, undefined: todos
): Promise<SessionResponse> {
  try {
    if (!userId) return {
      success: false,
      message: 'No existe el userId',
      data: []
    };

    const sessions = await db.session.findMany({
      where: {
        userId,
        ...(status !== undefined && { status }), // Aplica solo si viene definido
      },
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
};

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
};

/* General actions */
// 🟢 Activar todos los clientes de un usuario
export async function activateAllSessions(userId: string): Promise<SessionResponse> {
  try {
    await db.session.updateMany({
      where: { userId },
      data: { status: true },
    })

    return {
      success: true,
      message: 'Todas las sesiones fueron activadas correctamente.',
    }
  } catch (error) {
    console.error('Error al activar todas las sesiones:', error)
    return {
      success: false,
      message: 'No se pudieron activar todas las sesiones.',
    }
  }
};

// 🔴 Desactivar todos los clientes de un usuario
export async function deactivateAllSessions(userId: string): Promise<SessionResponse> {
  try {
    await db.session.updateMany({
      where: { userId },
      data: { status: false },
    })

    return {
      success: true,
      message: 'Todas las sesiones fueron desactivadas correctamente.',
    }
  } catch (error) {
    console.error('Error al desactivar todas las sesiones:', error)
    return {
      success: false,
      message: 'No se pudieron desactivar todas las sesiones.',
    }
  }
};

// 🗑️ Eliminar todos los clientes de un usuario
export async function deleteAllSessions(userId: string): Promise<SessionResponse> {
  try {
    await db.session.deleteMany({
      where: { userId },
    })

    return {
      success: true,
      message: 'Todas las sesiones fueron eliminadas correctamente.',
    }
  } catch (error) {
    console.error('Error al eliminar todas las sesiones:', error)
    return {
      success: false,
      message: 'No se pudieron eliminar las sesiones.',
    }
  }
};

export async function registerSession(input: z.infer<typeof registerSessionSchema>): Promise<SessionResponse<Session>> {
  const validation = registerSessionSchema.safeParse(input);

  if (!validation.success) {
    const issues = validation.error.issues.map(issue => issue.message).join(", ");
    return {
      success: false,
      message: `Datos inválidos: ${issues}`,
    };
  }

  const { userId, remoteJid, pushName, instanceId } = validation.data; //TODO: ELIMINAR PARA CAMBIOS ALEXANDER. Se debe cambiar el schema

  try {
    const existingSession = await db.session.findFirst({
      where: { remoteJid, instanceId },  //TODO: ELIMINAR PARA CAMBIOS ALEXANDER. Se debe cambiar el schema
    });

    if (existingSession) {
      const updated = await db.session.update({
        where: { id: existingSession.id },
        data: {
          pushName,
          updatedAt: new Date(),
        },
      });

      return {
        success: true,
        message: "Sesión actualizada correctamente.",
        data: updated,
      };
    }

    const created = await db.session.create({
      data: {
        userId,
        remoteJid,
        pushName,
        instanceId, //TODO: ELIMINAR PARA CAMBIOS ALEXANDER. Se debe cambiar el schema
        status: true,
      },
    });

    return {
      success: true,
      message: "Sesión creada correctamente.",
      data: created,
    };
  } catch (error) {
    console.error("[REGISTER_SESSION]", error);
    return {
      success: false,
      message: "Error al registrar la sesión.",
    };
  }
};

/**
* 🔎 Obtiene una única sesión por su remoteJid asociado a un userId.
*/
export async function getSessionByRemoteJid(userId: string, remoteJid: string): Promise<SessionResponseSingle> {
  try {
    if (!userId || !remoteJid) return {
      success: false,
      message: 'Se requieren userId y remoteJid.',
      data: {} as Session // Aseguramos el tipo de retorno aunque esté vacío
    };

    const session = await db.session.findFirst({
      where: {
        userId,
        remoteJid,
      },
    });

    if (!session) {
      return {
        success: false,
        message: `No se encontró sesión para el JID ${remoteJid} en el usuario ${userId}.`,
        data: {} as Session
      };
    }

    return {
      success: true,
      message: 'Sesión obtenida correctamente.',
      data: session 
    };

  } catch (error) {
    console.error('Error al obtener la sesión por remoteJid:', error);

    let errorMessage = 'Error interno al buscar la sesión.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return {
      success: false,
      message: errorMessage
    };
  }
}
