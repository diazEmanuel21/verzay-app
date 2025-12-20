"use server"
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { minioClient } from "@/lib/minio";
import { createNodeflowSchema, createNodeflowSchemaType } from "@/schema/nodeflow";
import { MAX_NODES_PER_WORKFLOW, MAX_SEGUIMIENTOS_PER_WORKFLOW } from "@/types/workflow";
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

  const totalNodes = await db.workflowNode.count({
    where: { workflowId: data.workflowId },
  });

  // Si el flujo ya está en 10 (o más), no permitir agregar más (incluye flujos antiguos > 10)
  if (totalNodes >= MAX_NODES_PER_WORKFLOW) {
    throw new Error(
      `Este flujo ya alcanzó el límite de ${MAX_NODES_PER_WORKFLOW} nodos. Elimina un nodo existente para poder agregar uno nuevo.`
    );
  }
  const requestedTipo = (data.tipo ?? "").toLowerCase();
  const isSeguimiento =
    requestedTipo === "seguimiento" || requestedTipo.startsWith("seguimiento-");
  if (isSeguimiento) {
    const seguimientosCount = await db.workflowNode.count({
      where: {
        workflowId: data.workflowId,
        OR: [
          { tipo: { equals: "seguimiento" } },
          { tipo: { startsWith: "seguimiento" } },
        ],
      },
    });
    if (seguimientosCount >= MAX_SEGUIMIENTOS_PER_WORKFLOW) {
      throw new Error(
        `Este flujo ya tiene el máximo de ${MAX_SEGUIMIENTOS_PER_WORKFLOW} nodos de seguimiento permitidos para evitar spam.`
      );
    }
  }

  const maxOrder = await db.workflowNode.aggregate({
    where: { workflowId: data.workflowId },
    _max: { order: true },
  });

  const parseMaxOrder = (maxOrder._max.order ?? 0) as number;

  const result = await db.workflowNode.create({
    data: {
      ...data,
      order: parseMaxOrder + 1, // siguiente orden disponible
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

export async function updateNodeOrder(nodeId: string, order: number) {
  try {
    if (!nodeId) {
      return {
        success: false,
        message: 'Parámetro "nodeId" requerido.',
      };
    }

    const updatedNode = await db.workflowNode.update({
      where: { id: nodeId },
      data: { order }, // 👈 solo se actualiza el orden
    });

    return {
      success: true,
      message: 'Orden del nodo actualizado con éxito.',
      data: updatedNode,
    };
  } catch (error: any) {
    console.error("Error updateNodeOrder:", error);
    return {
      success: false,
      message: 'Error al actualizar el orden: ' + (error.message || error),
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

//Método para eliminar TODOS los nodos asociados a un workflowId
export async function deleteAllNodes(workflowId: string) {
  try {
    if (!workflowId) {
      return {
        success: false,
        message: "ID del flujo no proporcionado.",
      }
    }

    const deletedNode = await db.workflowNode.deleteMany({
      where: { workflowId },
    })

    return {
      success: true,
      message: "Nodos eliminados con éxito.",
      data: deletedNode,
    }
  } catch (error) {
    console.error("Error al intentar eliminar los nodos:", error)
    return {
      success: false,
      message: "Ocurrió un error al eliminar los nodos.",
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

/* Defectuoso */
export async function deleteWorkflowFiles(userId: string, workflowId: string) {
  const bucket = process.env.S3_BUCKET_NAME;
  if (!bucket) {
    throw new Error("Falta S3_BUCKET_NAME en variables de entorno.");
  }
  const basePrefix = `verzay-media/${userId}`;

  try {
    const stream = minioClient.listObjectsV2(bucket, basePrefix, true);
    const objectsToDelete: string[] = [];

    for await (const obj of stream) {
      if (obj.name?.startsWith(`${basePrefix}${workflowId}/`)) {
        objectsToDelete.push(obj.name);
      }
    }

    if (objectsToDelete.length === 0) {
      return {
        success: true,
        message: "No se encontraron archivos asociados al flujo.",
        data: [],
      };
    }

    await minioClient.removeObjects(bucket, objectsToDelete);

    return {
      success: true,
      message: `Se eliminaron ${objectsToDelete.length} archivo(s) del flujo.`,
      data: objectsToDelete,
    };
  } catch (error) {
    console.error("Error al eliminar archivos del flujo:", error);
    return {
      success: false,
      message: "Ocurrió un error al eliminar archivos del flujo.",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
