"use server";

import { DeleteWorkflow } from "@/actions/deleteWorkflow";
import { deleteAllNodes, deleteFileNode } from "./createNode";
import { WorkflowNode } from '@prisma/client';
import { db } from "@/lib/db";

export async function deleteEntireWorkflow(userId: string, workflowId: string) {
  try {
    // #1. Se obtienen todos los nodos
    const nodes = await db.workflowNode.findMany({ where: { workflowId } });

    if (nodes.length > 0) {
      // #2. Eliminar archivos de todos los nodos en paralelo
      const deleteResults = await Promise.all(
        nodes.map((node) => deleteFileNode(node?.url ?? '', node.workflowId))
      );

      // #3. Verificar si alguno falló
      const failed = deleteResults.find((res) => !res.success);

      // if (failed) {
      //   return {
      //     success: false,
      //     message: "Error al eliminar uno o más archivos del flujo.",
      //     stage: "files",
      //     detail: failed.message || "Error desconocido en la eliminación de archivos.",
      //   };
      // }
    }

    // ✅ Archivos eliminados, continuar...

    // #4. Eliminar nodos
    const nodesRes = await deleteAllNodes(workflowId);
    if (!nodesRes.success) {
      return {
        success: false,
        message: "Error al eliminar los nodos del flujo.",
        stage: "nodes",
        detail: nodesRes.message,
      };
    }

    // #5. Eliminar el flujo
    const workflowRes = await DeleteWorkflow(workflowId);
    if (!workflowRes.success) {
      return {
        success: false,
        message: "Error al eliminar el flujo.",
        stage: "workflow",
        detail: workflowRes.message,
      };
    }

    // ✅ Todo correcto
    return {
      success: true,
      message: "Flujo y datos relacionados eliminados correctamente.",
    };
  } catch (error) {
    console.error("Error inesperado en deleteEntireWorkflow:", error);
    return {
      success: false,
      message: "Error inesperado al eliminar el flujo completo.",
      stage: "general",
      detail: error instanceof Error ? error.message : String(error),
    };
  }
}