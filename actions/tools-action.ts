'use server'

import { db } from '@/lib/db'

export type Tools = 'drive' | 'docs' | 'sheets'

export async function createTool(userId: string, name: Tools, description: string) {
  try {
    const tool = await db.tools.create({
      data: { userId, name, description },
    })
    return { success: true, data: tool }
  } catch (error) {
    console.error('Error al crear herramienta:', error)
    return { success: false, message: 'No se pudo crear la herramienta.' }
  }
}

export async function getTools(userId: string) {
  try {
    const tools = await db.tools.findMany({ where: { userId } })
    return { success: true, data: tools }
  } catch (error) {
    console.error('Error al obtener herramientas:', error)
    return { success: false, message: 'No se pudieron cargar las herramientas.' }
  }
}

export async function updateTool(id: string, name: Tools, description: string) {
  try {
    const tool = await db.tools.update({
      where: { id },
      data: { name, description },
    })
    return { success: true, data: tool }
  } catch (error) {
    console.error('Error al actualizar herramienta:', error)
    return { success: false, message: 'No se pudo actualizar la herramienta.' }
  }
}

export async function deleteTool(id: string) {
  try {
    await db.tools.delete({ where: { id } })
    return { success: true }
  } catch (error) {
    console.error('Error al eliminar herramienta:', error)
    return { success: false, message: 'No se pudo eliminar la herramienta.' }
  }
}
