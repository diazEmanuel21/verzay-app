'use server';

import { db } from '@/lib/db';
import { Appointment, AppointmentStatus } from '@prisma/client';
import { parseISO, isBefore } from 'date-fns';

interface AppointmentOperationResponse {
    success: boolean;
    message: string;
    data?: Appointment | Appointment[];
}

// ✅ Obtener citas por usuario (Asesor)
export async function getAppointmentsByUser(userId: string): Promise<AppointmentOperationResponse> {
    try {
        const list = await db.appointment.findMany({
            where: { userId },
            include: { session: true },
            orderBy: { startTime: 'asc' },
        });

        return {
            success: true,
            message: 'Citas obtenidas correctamente.',
            data: list,
        };
    } catch (error) {
        console.error('Error al obtener citas:', error);
        return {
            success: false,
            message: 'Error al obtener las citas.',
        };
    }
}

// ✅ Crear una cita
export async function createAppointment(data: {
    userId: string;
    sessionId: number;
    startTime: string;
    endTime: string;
    timezone: string;
}): Promise<AppointmentOperationResponse> {
    const { userId, sessionId, startTime, endTime, timezone } = data;

    if (!userId || !sessionId || !startTime || !endTime || !timezone) {
        return {
            success: false,
            message: 'Faltan campos requeridos.',
        };
    }

    const start = parseISO(startTime);
    const end = parseISO(endTime);

    if (isBefore(end, start)) {
        return {
            success: false,
            message: 'La hora final no puede ser menor a la hora inicial.',
        };
    }

    try {
        const overlap = await db.appointment.findFirst({
            where: {
                userId,
                startTime: start,
            },
        });

        if (overlap) {
            return {
                success: false,
                message: 'Ya existe una cita registrada en ese horario.',
            };
        }

        const created = await db.appointment.create({
            data: {
                userId,
                sessionId,
                startTime: start,
                endTime: end,
                timezone,
                status: AppointmentStatus.PENDIENTE,
            },
        });

        return {
            success: true,
            message: 'Cita creada exitosamente.',
            data: created,
        };
    } catch (error) {
        console.error('Error al crear la cita:', error);
        return {
            success: false,
            message: 'Error al crear la cita.',
        };
    }
}

// ✅ Actualizar estado de cita
export async function updateAppointmentStatus(id: string, status: AppointmentStatus): Promise<AppointmentOperationResponse> {
    try {
        const updated = await db.appointment.update({
            where: { id },
            data: { status },
        });

        return {
            success: true,
            message: 'Estado actualizado correctamente.',
            data: updated,
        };
    } catch (error) {
        console.error('Error al actualizar estado de la cita:', error);
        return {
            success: false,
            message: 'No se pudo actualizar el estado.',
        };
    }
}

// ✅ Eliminar una cita
export async function deleteAppointment(id: string): Promise<AppointmentOperationResponse> {
    try {
        await db.appointment.delete({ where: { id } });

        return {
            success: true,
            message: 'Cita eliminada correctamente.',
        };
    } catch (error) {
        console.error('Error al eliminar la cita:', error);
        return {
            success: false,
            message: 'No se pudo eliminar la cita.',
        };
    }
}