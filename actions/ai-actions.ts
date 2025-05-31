// AiCreatePrompt refactorizado con useForm y zodResolver

'use server'

import { db } from '@/lib/db'
import { SystemMessage } from '@prisma/client'
import { PromptAiFormValues, PromptAiSchema } from '@/schema/ai'


export interface PromptAiResponse<> {
    success: boolean
    message: string
    data?: SystemMessage[]
}

export async function getPromptAiByUserId(userId: string): Promise<PromptAiResponse> {
    if (!userId) {
        return {
            success: false,
            message: 'Datos incompletos o invalidos.',
        }
    }
    try {
        const data = await db.systemMessage.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        })

        if (!data || data.length === 0) {
            return {
                success: true,
                message: 'No se encontraron mensajes para este usuario.',
            }
        }

        return {
            success: true,
            message: 'Mensajes cargados exitosamente.',
            data,
        }
    } catch (error: any) {
        return {
            success: false,
            message: error.message || 'Error al obtener los mensajes.',
        }
    }
}

export async function createPromptAi(formData: PromptAiFormValues): Promise<PromptAiResponse> {
    try {
        const parse = PromptAiSchema.safeParse(formData);

        if (!parse.success) {
            return {
                success: false,
                message: "Datos inválidos. Corrige los campos requeridos.",
            };
        }

        const data = parse.data;

        const message = await db.systemMessage.create({
            data: {
                title: data.title,
                message: data.message,
                typePrompt: data.typePrompt,
                user: {
                    connect: { id: data.userId },
                },
            },
        })

        return {
            success: true,
            message: 'Mensaje del sistema agregado exitosamente.',
            data: [message],
        }
    } catch (error: any) {
        return {
            success: false,
            message: error.message || 'Error al agregar el mensaje del sistema.',
        }
    }
}

export async function updatePromptAi(formData: PromptAiFormValues): Promise<PromptAiResponse> {
    try {
        const parse = PromptAiSchema.safeParse(formData);

        if (!parse.success) {
            return {
                success: false,
                message: "Datos inválidos. Corrige los campos requeridos.",
            };
        }

        const data = parse.data;


        const message = await db.systemMessage.update({
            where: { id: data.id },
            data: {
                title: data.title,
                message: data.message,
                typePrompt: data.typePrompt,
            },
        })

        return {
            success: true,
            message: 'Mensaje actualizado exitosamente.',
            data: [message],
        }
    } catch (error: any) {
        return {
            success: false,
            message: error.message || 'Error al actualizar el mensaje.',
        }
    }
}

export async function deletePromptAi(id: string): Promise<PromptAiResponse> {
    try {
        await db.systemMessage.delete({ where: { id } })
        return {
            success: true,
            message: 'Mensaje eliminado exitosamente.',
        }
    } catch (error: any) {
        return {
            success: false,
            message: error.message || 'Error al eliminar el mensaje.',
        }
    }
}