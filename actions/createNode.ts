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