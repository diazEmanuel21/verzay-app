'use server';

import { db } from "@/lib/db";
import { z } from "zod";
import { PromptInstance } from "@prisma/client";
import { revalidatePath } from "next/cache";

// Esquemas de validación con Zod
const promptInstanciaSchema = z.object({
  tipoInstancia: z.string().optional(),
  description: z.string().optional(),
  contenido: z.string().optional(),
  // `coercion` permite que Zod intente convertir el valor a un número.
  // Esto es más seguro que un `Number()` manual.
  instanciaId: z.coerce.number().int().optional().nullable(),
  userId: z.string().min(1, "El userId es obligatorio"),
});

const getPromptsSchema = z.object({
  userId: z.string().min(1, "El userId es obligatorio"),
});

 const updatePromptSchema = promptInstanciaSchema.partial().extend({
  id: z.coerce.number().int().min(1, "El id es obligatorio"),
});

 const deletePromptSchema = z.object({
  id: z.coerce.number().int().min(1, "El id es obligatorio"),
});

// Interfaz de respuesta consistente
 interface ActionResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

/**
 * **1. Crear (Create)**
 * Crea un nuevo registro de PromptInstance.
 * @param formData - Datos del formulario.
 */
export async function createPromptInstancia(formData: FormData): Promise<ActionResponse<PromptInstance>> {
  // Se obtiene el objeto de la misma manera
  const data = Object.fromEntries(formData.entries());

  const validation = promptInstanciaSchema.safeParse(data);

  if (!validation.success) {
    return {
      success: false,
      message: "Datos de entrada inválidos.",
    };
  }

  try {
    const newPrompt = await db.promptInstance.create({
      data: {
        ...validation.data,
      },
    });
    revalidatePath('/dashboard/prompts');
    return {
      success: true,
      message: "Prompt de instancia creado con éxito.",
      data: newPrompt,
    };
  } catch (error) {
    console.error("[CREATE_PROMPT_INSTANCIA_ERROR]", error);
    return {
      success: false,
      message: "Error al crear el prompt de instancia.",
    };
  }
}

/**
 * **2. Leer (Read)**
 * Obtiene todos los prompts de un usuario específico.
 * @param userId - ID del usuario.
 */
export async function getPromptsByUserId(userId: string): Promise<ActionResponse<PromptInstance[]>> {
  const validation = getPromptsSchema.safeParse({ userId });

  if (!validation.success) {
    return {
      success: false,
      message: "User ID inválido",
    };
  }

  try {
    const prompts = await db.promptInstance.findMany({
      where: { userId },
      orderBy: { id: "desc" },
    });
    return {
      success: true,
      message: "Prompts obtenidos correctamente.",
      data: prompts,
    };
  } catch (error) {
    console.error("[GET_PROMPTS_BY_USER_ID_ERROR]", error);
    return {
      success: false,
      message: "Error al obtener los prompts.",
    };
  }
}

/**
 * **3. Actualizar (Update)**
 * Actualiza un prompt de instancia existente.
 * @param id - ID del prompt.
 * @param formData - Datos del formulario.
 */
export async function updatePromptInstancia(id: number, formData: FormData): Promise<ActionResponse<PromptInstance>> {
  // ** Corrección aquí: Obteniendo todos los campos del formData, incluido el userId.
  const data = {
    ...Object.fromEntries(formData.entries()),
    id,
  };

  const validation = updatePromptSchema.safeParse(data);

  if (!validation.success) {
    console.log(validation.error.issues); // Esto te ayudará a depurar el problema
    return {
      success: false,
      message: "Datos de entrada inválidos para la actualización.",
    };
  }

  try {
    const updatedPrompt = await db.promptInstance.update({
      where: { id },
      data: validation.data,
    });
    revalidatePath('/dashboard/prompts');
    return {
      success: true,
      message: "Prompt de instancia actualizado con éxito.",
      data: updatedPrompt,
    };
  } catch (error) {
    console.error("[UPDATE_PROMPT_INSTANCIA_ERROR]", error);
    return {
      success: false,
      message: "Error al actualizar el prompt de instancia.",
    };
  }
}

/**
 * **4. Eliminar (Delete)**
 * Elimina un prompt de instancia.
 * @param id - ID del prompt.
 */
export async function deletePromptInstancia(id: number): Promise<ActionResponse<void>> {
  const validation = deletePromptSchema.safeParse({ id });

  if (!validation.success) {
    return {
      success: false,
      message: "ID de prompt inválido.",
    };
  }

  try {
    await db.promptInstance.delete({
      where: { id },
    });
    revalidatePath('/dashboard/prompts');
    return {
      success: true,
      message: "Prompt de instancia eliminado con éxito.",
    };
  } catch (error) {
    console.error("[DELETE_PROMPT_INSTANCIA_ERROR]", error);
    return {
      success: false,
      message: "Error al eliminar el prompt de instancia.",
    };
  }
}