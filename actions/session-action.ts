'use server'

import { db } from '@/lib/db'
import { Session } from '@prisma/client';

interface SessionResponse<T = Session[]> {
    success: boolean;
    message: string;
    data?: T;
};

export async function getSessionsByUserId(userId: string): Promise<SessionResponse> {

    try {
        if (!userId) return {
            success: false,
            message: 'No existe el userId',
            data: []
        };

        const sessions = await db.session.findMany({ where: { userId } });

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
};

export async function updateSessionStatus(sessionId: number, status: boolean): Promise<SessionResponse> {
    try {
        await db.session.update({
            where: { id: sessionId },  // campo único para identificar la sesión
            data: { status }          // campo que se actualizará
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
        // Verificar primero que exista la sesión con todos los criterios
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

        // Eliminar usando el ID que ya verificamos
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