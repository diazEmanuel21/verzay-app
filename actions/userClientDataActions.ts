"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

/**
 * Edita los datos de cliente en el modelo User.
 */
export async function editarDatosCliente(userId: string, data: {
  apiUrl: string;
  company: string;
  notificationNumber: string;
  lat: string;
  lng: string;
  openingPhrase: string;
  mapsUrl: string;
}) {
  try {
    const {
      apiUrl,
      company,
      notificationNumber,
      lat,
      lng,
      openingPhrase,
      mapsUrl,
    } = data;

    if (
      !userId ||
      !apiUrl ||
      !company ||
      !notificationNumber ||
      !lat ||
      !lng ||
      !openingPhrase ||
      !mapsUrl
    ) {
      throw new Error("Todos los campos son obligatorios.");
    }

    await db.user.update({
      where: { id: userId },
      data: {
        apiUrl,
        company,
        notificationNumber,
        lat,
        lng,
        openingPhrase,
        mapsUrl,
      },
    });

    revalidatePath("/ia/(root)/add"); // Ruta relacionada con el contexto

    return { success: true, message: "Datos del cliente actualizados exitosamente." };
  } catch (error: any) {
    console.error(error);
    return { success: false, message: error.message || "Error al actualizar los datos del cliente." };
  }
}

export async function obtenerDatosCliente(userId: string) {
  try {
    if (!userId) throw new Error("El ID de usuario es obligatorio.");

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        apiUrl: true,
        company: true,
        notificationNumber: true,
        lat: true,
        lng: true,
        openingPhrase: true,
        mapsUrl: true,
      },
    });

    if (!user) throw new Error("Usuario no encontrado.");

    return { success: true, data: user };
  } catch (error: any) {
    console.error(error);
    return { success: false, message: error.message || "Error al obtener los datos del cliente." };
  }
}
