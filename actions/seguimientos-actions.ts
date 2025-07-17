// app/actions/seguimientos-actions.ts
'use server'

import { db } from "@/lib/db"
import { seguimientosSchema } from "@/schema/seguimientos"

export const createSeguimiento = async (input: unknown) => {
  const validated = seguimientosSchema.safeParse(input)

  if (!validated.success) {
    return {
      success: false,
      message: "Datos inválidos",
      error: validated.error.flatten(),
    }
  }

  try {
    const seguimiento = await db.seguimientos.create({
      data: validated.data,
    })

    return {
      success: true,
      message: "Seguimiento creado correctamente",
      data: seguimiento,
    }
  } catch (error) {
    console.error("Error al crear seguimiento:", error)
    return {
      success: false,
      message: "Ocurrió un error al guardar el seguimiento",
    }
  }
}
