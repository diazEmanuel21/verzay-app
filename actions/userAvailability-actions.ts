'use server'

import { db } from '@/lib/db'
import { UserAvailability } from '@prisma/client'

interface AvailabilityOperationResponse {
    success: boolean
    message: string
    data?: UserAvailability[] | UserAvailability
}

// ✅ Obtener la disponibilidad de un usuario
export async function getUserAvailability(userId: string): Promise<AvailabilityOperationResponse> {
    try {
        const list = await db.userAvailability.findMany({
            where: { userId },
            orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }]
        })

        return {
            success: true,
            message: 'Disponibilidad cargada correctamente.',
            data: list
        }
    } catch (error) {
        console.error('Error al obtener disponibilidad:', error)
        return {
            success: false,
            message: 'Error al obtener la disponibilidad.'
        }
    }
}

// ✅ Crear nueva disponibilidad
export async function createAvailability(data: {
    userId: string
    dayOfWeek: number
    startTime: string
    endTime: string
}): Promise<AvailabilityOperationResponse> {
    const { userId, dayOfWeek, startTime, endTime } = data

    if (!userId || dayOfWeek === undefined || !startTime || !endTime) {
        return {
            success: false,
            message: 'Faltan campos requeridos.'
        }
    }

    if (startTime >= endTime) {
        return {
            success: false,
            message: 'La hora de inicio debe ser menor a la hora de fin.'
        }
    }

    try {
        const exists = await db.userAvailability.findFirst({
            where: { userId, dayOfWeek, startTime, endTime }
        })

        if (exists) {
            return {
                success: false,
                message: 'Este horario ya existe para ese día.'
            }
        }

        const created = await db.userAvailability.create({ data })

        return {
            success: true,
            message: 'Horario creado correctamente.',
            data: created
        }
    } catch (error) {
        console.error('Error al crear disponibilidad:', error)
        return {
            success: false,
            message: 'Error al crear el horario.'
        }
    }
}

// ✅ Eliminar un horario de disponibilidad
export async function deleteAvailability(id: string): Promise<AvailabilityOperationResponse> {
    try {
        await db.userAvailability.delete({ where: { id } })

        return {
            success: true,
            message: 'Horario eliminado correctamente.'
        }
    } catch (error) {
        console.error('Error al eliminar disponibilidad:', error)
        return {
            success: false,
            message: 'Error al eliminar el horario.'
        }
    }
}

export async function updateAvailability(id: string, startTime: string, endTime: string) {
    try {
        const updated = await db.userAvailability.update({
            where: { id },
            data: { startTime, endTime },
        });

        return { success: true, data: updated };
    } catch (error) {
        console.error("Error al actualizar disponibilidad:", error);
        return { success: false, message: "No se pudo actualizar la disponibilidad." };
    }
}