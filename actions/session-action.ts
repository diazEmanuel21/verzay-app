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

export async function deleteSession(id: number): Promise<SessionResponse> {
    try {
        await db.session.delete({ where: { id } });

        return {
            success: true,
            message: 'Se eliminó correctamente.'
        };

    } catch (error) {
        console.error('Error al eliminar herramienta:', error)
        return { success: false, message: 'No se pudo eliminar la sesión.' }
    }
};