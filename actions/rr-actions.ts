'use server';

import { db } from '@/lib/db';
import { QuickReply } from '@prisma/client';

interface RROperationResponse {
    success: boolean;
    message: string;
    data?: QuickReply[];
}

export async function getAllRRs(userId: string): Promise<RROperationResponse> {
    try {
        const list = await db.quickReply.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
        return {
            success: true,
            message: 'Registros obtenidos correctamente.',
            data: list,
        };
    } catch (error) {
        console.error('Error al obtener registros rr:', error);
        return {
            success: false,
            message: 'Error al obtener los registros.',
        };
    }
}

export async function createRR(data: {
    workflowId: string;
    mensaje?: string;
    userId: string;
}): Promise<RROperationResponse> {
    try {
        await db.quickReply.create({ data });
        return {
            success: true,
            message: 'Registro creado correctamente.',
        };
    } catch (error) {
        console.error('Error al crear rr:', error);
        return {
            success: false,
            message: 'Error al crear el registro.',
        };
    }
}

export async function getAllRRsByWorkflowId(workflowId: string): Promise<RROperationResponse> {
    try {
        const list = await db.quickReply.findMany({
            where: { workflowId },
            orderBy: { createdAt: 'desc' },
        });
        return {
            success: true,
            message: 'Registros obtenidos correctamente.',
            data: list,
        };
    } catch (error) {
        console.error('Error al obtener registros rr:', error);
        return {
            success: false,
            message: 'Error al obtener los registros.',
        };
    }
}

export async function updateRR(id: number, data: Partial<QuickReply>): Promise<RROperationResponse> {
    try {
        await db.quickReply.update({
            where: { id },
            data,
        });
        return {
            success: true,
            message: 'Registro actualizado correctamente.',
        };
    } catch (error) {
        console.error('Error al actualizar rr:', error);
        return {
            success: false,
            message: 'Error al actualizar el registro.',
        };
    }
}

export async function deleteRR(id: number): Promise<RROperationResponse> {
    try {
        await db.quickReply.delete({ where: { id } });
        return {
            success: true,
            message: 'Registro eliminado correctamente.',
        };
    } catch (error) {
        console.error('Error al eliminar rr:', error);
        return {
            success: false,
            message: 'Error al eliminar el registro.',
        };
    }
}
