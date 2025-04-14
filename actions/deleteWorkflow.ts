"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function DeleteWorkflow(id: string) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return {
        success: false,
        message: "No se encontró una sesión activa.",
      };
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return {
        success: false,
        message: "Usuario no encontrado en la base de datos.",
      };
    }

    const deleted = await db.workflow.delete({
      where: {
        id,
        userId: user.id,
      },
    });

    return {
      success: true,
      message: `Flujo "${deleted.name}" eliminado correctamente.`,
      data: deleted,
    };
  } catch (error: any) {
    console.error("Error al eliminar el flujo:", error);

    return {
      success: false,
      message: "Ocurrió un error al eliminar el flujo.",
      error: error?.message || error,
    };
  }
}
