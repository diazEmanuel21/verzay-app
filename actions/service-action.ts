'use server'

import { db } from '@/lib/db'
import { Service } from '@prisma/client';
import { z } from 'zod'

interface ServiceOperationResponse {
    success: boolean;
    message: string;
    data?: Service[];
}

/**
 * Esquema de validación para crear o actualizar un servicio
 */
const baseSchema = z.object({
    userId: z.string().min(1),
    name: z.string().min(2, 'El nombre es obligatorio'),
    messageText: z.string().min(5, 'El mensaje debe ser más descriptivo'),
})

/**
 * Esquema extendido que incluye el ID (para update)
 */
const updateSchema = baseSchema.extend({
    id: z.string().min(1, 'El ID es obligatorio'),
})

/**
 * Crea un nuevo servicio asociado a un usuario
 */
export async function createService(values: z.infer<typeof baseSchema>): Promise<ServiceOperationResponse> {
    const validated = baseSchema.safeParse(values)
    if (!validated.success) {
        return { success: false, message: validated.error.errors[0].message }
    }

    try {
        await db.service.create({
            data: validated.data,
        })

        return { success: true, message: 'Servicio creado correctamente' }
    } catch (error) {
        console.error('Error al crear servicio:', error)
        return { success: false, message: 'Error al crear el servicio' }
    }
}

/**
 * Obtiene todos los servicios asociados a un usuario específico
 */
export async function getServicesByUser(userId: string): Promise<ServiceOperationResponse> {
    if (!userId) return { success: false, message: 'Falta el userId' }

    try {
        const services = await db.service.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        })

        return { success: true, message: 'Petición realizada con ', data: services }
    } catch (error) {
        console.error('Error al obtener servicios:', error)
        return { success: false, message: 'Error al obtener servicios' }
    }
}

/**
 * Elimina un servicio por su ID
 */
export async function deleteService(serviceId: string): Promise<ServiceOperationResponse> {
    if (!serviceId) return { success: false, message: 'Falta el ID del servicio' }

    try {
        await db.service.delete({
            where: { id: serviceId },
        })

        return { success: true, message: 'Servicio eliminado correctamente' }
    } catch (error) {
        console.error('Error al eliminar servicio:', error)
        return { success: false, message: 'Error al eliminar el servicio' }
    }
}

/**
 * Actualiza un servicio existente usando su ID
 */
export async function updateService(values: z.infer<typeof updateSchema>): Promise<ServiceOperationResponse> {
    const validated = updateSchema.safeParse(values)
    if (!validated.success) {
        return { success: false, message: validated.error.errors[0].message }
    }

    try {
        const { id, ...data } = validated.data

        await db.service.update({
            where: { id },
            data,
        })

        return { success: true, message: 'Servicio actualizado correctamente' }
    } catch (error) {
        console.error('Error al actualizar servicio:', error)
        return { success: false, message: 'Error al actualizar el servicio' }
    }
}