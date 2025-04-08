"use server"
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { minioClient } from "@/lib/minio";
import { createNodeflowSchema, createNodeflowSchemaType } from "@/schema/nodeflow";
import { redirect } from "next/navigation";

export async function CreateNode(form: createNodeflowSchemaType) {
  const session = await auth(); // Obtén la sesión del usuario

  if (!session?.user?.email) {
    throw new Error("Usuario no autenticado.");
  }

  const user = await db.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    throw new Error("Usuario no encontrado.");
  }

  const { success, data } = createNodeflowSchema.safeParse(form);

  if (!success) {
    throw new Error("Datos del formulario inválidos.");
  }

  const result = await db.workflowNode.create({
    data: {
      ...data,
    },
  });

  if (!result) {
    throw new Error("Falló la creación del nodo.");
  }

  redirect(`/flow/${data.workflowId}`);
}

// Método para editar un nodo
export async function updateNode(nodeId: string, newMessage?: string) {
  try {
    if (!nodeId) {
      return {
        success: false,
        message: 'Parámetro "nodeId" es requerido.',
      };
    }

    const updatedNode = await db.workflowNode.update({
      where: { id: nodeId },
      data: { message: newMessage ?? '' }, // Guarda string vacío si es null/undefined
    });

    return {
      success: true,
      message: 'Nodo actualizado con éxito.',
      data: updatedNode,
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Error al actualizar el nodo' + error?.message || error,
    };
  }
}

export async function updateUrlNode(nodeId: string, url: string) {
  try {
    if (!nodeId || !url) {
      return {
        success: false,
        message: 'Parámetros inválidos.'
      }
    }

    const updatedNode = await db.workflowNode.update({
      where: { id: nodeId },
      data: { url },
    });

    return {
      success: true,
      message: 'Archivo subido con éxito.',
      data: updatedNode
    }
  } catch (error) {
    console.error('Error update node', error);
    return {
      success: false,
      message: 'Ocurrió un error al intentar actualizar la url del nodo.',
    };
  }
}

export async function updateDelayNode(nodeId: string, delay: string) {
  try {
    if (!nodeId || !delay) {
      return {
        success: false,
        message: 'Parámetros inválidos.'
      }
    }

    const updatedNode = await db.workflowNode.update({
      where: { id: nodeId },
      data: { delay },
    });

    return {
      success: true,
      message: 'Seguimiento actualizado con éxito.',
      data: updatedNode
    }
  } catch (error) {
    console.error('Error update node', error);
    return {
      success: false,
      message: 'Ocurrió un error al actualizar el seguimiento.',
    };
  }
}

export async function updateInactivityNode(nodeId: string, inactividad: boolean) {
  try {
    if (!nodeId) {
      return {
        success: false,
        message: 'Parámetros inválidos.'
      }
    };

    const updatedNode = await db.workflowNode.update({
      where: { id: nodeId },
      data: { inactividad },
    });

    return {
      success: true,
      message: 'Seguimiento actualizado con éxito.',
      data: updatedNode
    }
  } catch (error) {
    console.error('Error update node', error);
    return {
      success: false,
      message: 'Ocurrió un error al actualizar el seguimiento.',
    };
  }
}

// Método para eliminar un nodo
export async function deleteNode(nodeId: string, workflowId: string) {
  try {
    if (!nodeId) {
      return {
        success: false,
        message: "ID del nodo no proporcionado.",
      }
    }

    const deletedNode = await db.workflowNode.delete({
      where: { id: nodeId },
    })

    return {
      success: true,
      message: "Nodo eliminado con éxito.",
      data: deletedNode,
    }
  } catch (error) {
    console.error("Error al eliminar el nodo:", error)
    return {
      success: false,
      message: "Ocurrió un error al eliminar el nodo.",
    }
  }
}

export async function deleteFileNode(minIoUrl: string, nodeId: string) {
  try {
    if (!minIoUrl || !nodeId) {
      return {
        success: false,
        message: "Faltan parámetros necesarios.",
      }
    }

    const url = new URL(minIoUrl)
    const parts = url.pathname.split('/').filter(Boolean)

    const bucket = parts[0]
    const objectName = decodeURIComponent(parts.slice(1).join('/'))

    console.log("Eliminando archivo de MinIO:", { bucket, objectName })
    await minioClient.removeObject(bucket, objectName)

    // ✅ Limpiar la URL del nodo en la base de datos
    const updatedNode = await db.workflowNode.update({
      where: { id: nodeId },
      data: { url: null },
    })

    return {
      success: true,
      message: "Archivo eliminado y nodo actualizado con éxito.",
      data: updatedNode,
    }
  } catch (error) {
    console.error("Error al eliminar archivo o actualizar nodo:", error)
    return {
      success: false,
      message: "Ocurrió un error al eliminar el archivo o actualizar el nodo.",
    }
  }
}