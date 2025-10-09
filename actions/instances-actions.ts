import { db } from "@/lib/db";
import { z } from "zod";
import { Instancias } from "@prisma/client";

const getInstancesSchema = z.object({
  userId: z.string().min(1, "El userId es obligatorio"),
});

// 1. Corrige la interfaz para que 'data' sea siempre un array
export interface InstanceResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export async function getInstancesByUserId(userId: string): Promise<InstanceResponse<Instancias[]>> {
  const validation = getInstancesSchema.safeParse({ userId });

  if (!validation.success) {
    return {
      success: false,
      message: "User ID inválido",
      // 2. Retorna un array vacío en caso de error de validación
      data: []
    };
  }

  try {
    const instances = await db.instancias.findMany({
      where: { userId },
      orderBy: { id: "desc" },
    });

    return {
      success: true,
      message: "Instancias obtenidas correctamente",
      data: instances, // 'instances' es un array
    };
  } catch (error) {
    console.error("[GET_INSTANCES_BY_USER_ID]", error);
    return {
      success: false,
      message: "Error al obtener las instancias",
      // 3. Retorna un array vacío en caso de error de la base de datos
      data: []
    };
  }
}