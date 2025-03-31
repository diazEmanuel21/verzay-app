"use server"
import { auth } from "@/auth";
import { db } from "@/lib/db";
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
export async function updateNode(nodeId: string, newMessage: string) {
  if (!nodeId || !newMessage) {
    throw new Error("Parámetros inválidos.");
  }

  const updatedNode = await db.workflowNode.update({
    where: { id: nodeId },
    data: { message: newMessage },
  });

  return updatedNode;
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

// Método para eliminar un nodo
export async function deleteNode(nodeId: string, workflowId: string) {
  if (!nodeId) {
    throw new Error("ID del nodo no proporcionado.");
  }

  const deletedNode = await db.workflowNode.delete({
    where: { id: nodeId },
  });

  redirect(`/flow/${workflowId}`);
}