'use server'

import { z } from 'zod'
import { db } from "@/lib/db";
import { PromptTemplate } from '@prisma/client';

export interface ModuleResponse {
    success: boolean
    message: string
    data?: PromptTemplate[]
}

const createTemplateSchema = z.object({
    name: z.string().min(3),
    description: z.string().optional(),
    content: z.string().min(10),
    category: z.string().optional(),
    isActive: z.boolean().default(true),
})

const updateTemplateSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(3),
    description: z.string().optional(),
    content: z.string().min(10),
    category: z.string().optional(),
    isActive: z.boolean(),
})

export async function createTemplate(input: z.infer<typeof createTemplateSchema>): Promise<ModuleResponse> {
    try {
        const data = createTemplateSchema.parse(input)

        const existing = await db.promptTemplate.findUnique({
            where: { name: data.name },
        })

        if (existing) {
            return {
                success: false,
                message: 'Ya existe una plantilla con ese nombre.',
            }
        }

        await db.promptTemplate.create({ data })

        return {
            success: true,
            message: 'Plantilla creada correctamente.',
        }
    } catch (error: any) {
        return {
            success: false,
            message: error.message || 'Error al crear plantilla.',
        }
    }
};

export async function updateTemplate(input: z.infer<typeof updateTemplateSchema>): Promise<ModuleResponse> {
    try {
        const data = updateTemplateSchema.parse(input)

        const exists = await db.promptTemplate.findUnique({ where: { id: data.id } })
        if (!exists) {
            return { success: false, message: 'La plantilla no existe.' }
        }

        await db.promptTemplate.update({
            where: { id: data.id },
            data: {
                name: data.name,
                description: data.description,
                content: data.content,
                category: data.category,
                isActive: data.isActive,
            },
        })

        return {
            success: true,
            message: 'Plantilla actualizada exitosamente.',
        }
    } catch (error: any) {
        return {
            success: false,
            message: error.message || 'Error al actualizar plantilla.',
        }
    }
};

export async function deleteTemplate(id: string): Promise<ModuleResponse> {
    try {
        const idSchema = z.string().uuid()
        idSchema.parse(id)

        const existing = await db.promptTemplate.findUnique({ where: { id } })

        if (!existing) {
            return { success: false, message: 'Plantilla no encontrada.' }
        }

        await db.promptTemplate.delete({ where: { id } })

        return {
            success: true,
            message: 'Plantilla eliminada correctamente.',
        }
    } catch (error: any) {
        return {
            success: false,
            message: error.message || 'Error al eliminar plantilla.',
        }
    }
};

export async function getAllTemplates(): Promise<ModuleResponse> {
    try {
        const data = await db.promptTemplate.findMany({
            orderBy: { createdAt: 'desc' },
        })

        return {
            success: true,
            message: 'Plantillas obtenidas correctamente.',
            data,
        }
    } catch (error: any) {
        return {
            success: false,
            message: error.message || 'Error al obtener plantillas.',
        }
    }
};