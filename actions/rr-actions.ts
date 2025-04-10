'use server';

import { db } from '@/lib/db';
import { rr } from '@prisma/client';

interface RROperationResponse {
  success: boolean;
  message: string;
  data?: rr | rr[];
}

export async function createRR(data: {
  workflowId: string;
  mensaje?: string;
}): Promise<RROperationResponse> {
  try {
    const created = await db.rr.create({ data });
    return {
      success: true,
      message: 'Registro creado correctamente.',
      data: created,
    };
  } catch (error) {
    console.error('Error al crear rr:', error);
    return {
      success: false,
      message: 'Error al crear el registro.',
    };
  }
}

export async function getAllRRs(workflowId: string): Promise<RROperationResponse> {
  try {
    const list = await db.rr.findMany({
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

export async function updateRR(id: number, data: Partial<rr>): Promise<RROperationResponse> {
  try {
    const updated = await db.rr.update({
      where: { id },
      data,
    });
    return {
      success: true,
      message: 'Registro actualizado correctamente.',
      data: updated,
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
    const deleted = await db.rr.delete({ where: { id } });
    return {
      success: true,
      message: 'Registro eliminado correctamente.',
      data: deleted,
    };
  } catch (error) {
    console.error('Error al eliminar rr:', error);
    return {
      success: false,
      message: 'Error al eliminar el registro.',
    };
  }
}
