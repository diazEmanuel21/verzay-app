import { db } from "@/lib/db";
import { z } from "zod";
import { Instancias } from "@prisma/client";

const getInstancesSchema = z.object({
  userId: z.string().min(1, "El userId es obligatorio"),
});

export interface InstanceResponse<T = Instancias | null> {
  success: boolean;
  message: string;
  data?: T;
}

export async function getInstancesByUserId(userId: string): Promise<InstanceResponse> {
  const validation = getInstancesSchema.safeParse({ userId });

  if (!validation.success) {
    return {
      success: false,
      message: "User ID inválido",
    };
  }

  try {
    const instance = await db.instancias.findFirst({
      where: { userId },
      orderBy: { id: "desc" },
    });

    return {
      success: true,
      message: "Instancia obtenida correctamente",
      data: instance,
    };
  } catch (error) {
    console.error("[GET_INSTANCES_BY_USER_ID]", error);
    return {
      success: false,
      message: "Error al obtener la instancia",
    };
  }
}